const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

/**
 * Parse Express.js route files and extract route information
 */
class RouteParser {
  constructor() {
    this.routes = [];
    this.functionCache = new Map(); // Cache parsed functions to avoid re-parsing
    this.importMap = new Map(); // Track imports in each file
  }

  /**
   * Parse a JavaScript file and extract Express routes
   * @param {string} filePath - Path to the file to parse
   * @param {string} inferredBasePath - Base path inferred from file location or app.use()
   */
  parseFile(filePath, inferredBasePath = '') {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      // Try to infer base path from filename if in routes directory
      let basePath = inferredBasePath;
      if (!basePath) {
        const fileName = path.basename(filePath, path.extname(filePath));
        const dirName = path.basename(path.dirname(filePath));
        
        // If file is in a 'routes' or 'api' directory, use filename as base path
        if (dirName === 'routes' || dirName === 'api') {
          basePath = `/${fileName}`;
        }
      }

      this.extractRoutes(ast, filePath, basePath);
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}: ${error.message}`);
    }
  }

  /**
   * Extract routes from AST
   * @param {Object} ast - Babel AST
   * @param {string} filePath - Source file path
   * @param {string} defaultBasePath - Default base path for this file
   */
  extractRoutes(ast, filePath, defaultBasePath = '') {
    const routes = [];
    let basePath = defaultBasePath;

    // First pass: extract imports/requires
    this.extractImports(ast, filePath);

    traverse(ast, {
      // Handle app.use('/path', router) to get base paths
      CallExpression: (path) => {
        const { node } = path;
        
        // Check for router.use() or app.use() with a path
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'use' &&
          node.arguments.length >= 1 &&
          node.arguments[0].type === 'StringLiteral'
        ) {
          // Store potential base path
          const potentialBasePath = node.arguments[0].value;
          if (potentialBasePath.startsWith('/')) {
            basePath = potentialBasePath;
          }
        }

        // Check for app.get(), app.post(), router.get(), etc.
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier'
        ) {
          const method = node.callee.property.name.toUpperCase();
          const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

          if (validMethods.includes(method) && node.arguments.length >= 1) {
            const routeInfo = this.extractRouteInfo(node, method, basePath, filePath);
            if (routeInfo) {
              routes.push(routeInfo);
            }
          }
        }
      }
    });

    this.routes.push(...routes);
  }

  /**
   * Extract imports/requires from file
   * @param {Object} ast - Babel AST
   * @param {string} filePath - Source file path
   */
  extractImports(ast, filePath) {
    const imports = {};

    traverse(ast, {
      // Handle: const { func1, func2 } = require('./controller')
      VariableDeclarator: (path) => {
        const { node } = path;
        
        if (node.init && 
            node.init.type === 'CallExpression' &&
            node.init.callee.name === 'require' &&
            node.init.arguments[0] &&
            node.init.arguments[0].type === 'StringLiteral') {
          
          const requirePath = node.init.arguments[0].value;
          
          // Handle destructured imports: const { loginHandler, registerHandler } = require(...)
          if (node.id.type === 'ObjectPattern') {
            node.id.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key && prop.key.name) {
                const funcName = prop.key.name;
                const localName = prop.value && prop.value.name ? prop.value.name : funcName;
                imports[localName] = {
                  source: requirePath,
                  name: funcName,
                  type: 'destructured'
                };
              }
            });
          }
          // Handle default imports: const controller = require(...)
          else if (node.id.type === 'Identifier') {
            imports[node.id.name] = {
              source: requirePath,
              name: 'default',
              type: 'default'
            };
          }
        }
      },
      // Handle ES6 imports if needed
      ImportDeclaration: (path) => {
        const { node } = path;
        const source = node.source.value;
        
        node.specifiers.forEach(spec => {
          if (spec.type === 'ImportSpecifier') {
            imports[spec.local.name] = {
              source,
              name: spec.imported.name,
              type: 'named'
            };
          } else if (spec.type === 'ImportDefaultSpecifier') {
            imports[spec.local.name] = {
              source,
              name: 'default',
              type: 'default'
            };
          }
        });
      }
    });

    this.importMap.set(filePath, imports);
  }

  /**
   * Resolve the actual file path from a require/import path
   * @param {string} importPath - Import path from require()
   * @param {string} currentFile - Current file path
   * @returns {string|null} Resolved file path
   */
  resolveImportPath(importPath, currentFile) {
    // Skip node_modules
    if (!importPath.startsWith('.')) {
      return null;
    }

    const currentDir = path.dirname(currentFile);
    let resolvedPath = path.resolve(currentDir, importPath);

    // Try with .js extension if not present
    if (!fs.existsSync(resolvedPath)) {
      if (!resolvedPath.endsWith('.js')) {
        resolvedPath += '.js';
      }
    }

    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }

    return null;
  }

  /**
   * Find and parse a controller function
   * @param {string} funcName - Function name to find
   * @param {string} currentFile - Current file path
   * @returns {Object|null} Function AST node
   */
  findControllerFunction(funcName, currentFile) {
    // Check if we've already cached this
    const cacheKey = `${currentFile}:${funcName}`;
    if (this.functionCache.has(cacheKey)) {
      return this.functionCache.get(cacheKey);
    }

    const imports = this.importMap.get(currentFile);
    if (!imports || !imports[funcName]) {
      return null;
    }

    const importInfo = imports[funcName];
    const controllerPath = this.resolveImportPath(importInfo.source, currentFile);
    
    if (!controllerPath) {
      return null;
    }

    try {
      const code = fs.readFileSync(controllerPath, 'utf-8');
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      let foundFunction = null;

      traverse(ast, {
        // Look for: const funcName = (req, res) => {}
        VariableDeclarator: (path) => {
          const { node } = path;
          if (node.id && node.id.name === importInfo.name &&
              (node.init.type === 'ArrowFunctionExpression' || 
               node.init.type === 'FunctionExpression')) {
            foundFunction = node.init;
          }
        },
        // Look for: function funcName(req, res) {}
        FunctionDeclaration: (path) => {
          const { node } = path;
          if (node.id && node.id.name === importInfo.name) {
            foundFunction = node;
          }
        },
        // Look for: exports.funcName = (req, res) => {}
        AssignmentExpression: (path) => {
          const { node } = path;
          if (node.left.type === 'MemberExpression' &&
              node.left.property && node.left.property.name === importInfo.name &&
              (node.right.type === 'ArrowFunctionExpression' ||
               node.right.type === 'FunctionExpression')) {
            foundFunction = node.right;
          }
        }
      });

      this.functionCache.set(cacheKey, foundFunction);
      return foundFunction;
    } catch (error) {
      console.warn(`Warning: Could not parse controller file ${controllerPath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Find a method on a controller object
   * @param {string} objectName - The controller object name
   * @param {string} methodName - The method name
   * @param {string} currentFile - Current file path
   * @returns {Object|null} Function AST node
   */
  findControllerMethod(objectName, methodName, currentFile) {
    // Check cache first
    const cacheKey = `${currentFile}:${objectName}.${methodName}`;
    if (this.functionCache.has(cacheKey)) {
      return this.functionCache.get(cacheKey);
    }

    // Find where the controller object is imported from
    const imports = this.importMap.get(currentFile);
    if (!imports || !imports[objectName]) {
      return null;
    }

    const importInfo = imports[objectName];
    const controllerPath = this.resolveImportPath(importInfo.source, currentFile);
    
    if (!controllerPath) {
      return null;
    }

    try {
      const code = fs.readFileSync(controllerPath, 'utf-8');
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      let foundFunction = null;

      traverse(ast, {
        // Look for: const methodName = (req, res) => {}
        VariableDeclarator: (path) => {
          const { node } = path;
          if (node.id && node.id.name === methodName &&
              (node.init.type === 'ArrowFunctionExpression' || 
               node.init.type === 'FunctionExpression')) {
            foundFunction = node.init;
          }
        },
        // Look for: function methodName(req, res) {}
        FunctionDeclaration: (path) => {
          const { node } = path;
          if (node.id && node.id.name === methodName) {
            foundFunction = node;
          }
        },
        // Look for: exports.methodName = (req, res) => {} or module.exports = { methodName: ... }
        ObjectProperty: (path) => {
          const { node } = path;
          if (node.key && node.key.name === methodName &&
              (node.value.type === 'ArrowFunctionExpression' ||
               node.value.type === 'FunctionExpression' ||
               node.value.type === 'Identifier')) {
            if (node.value.type === 'Identifier') {
              // The method references another function, need to find it
              const refName = node.value.name;
              // Store this for later resolution
            } else {
              foundFunction = node.value;
            }
          }
        }
      });

      this.functionCache.set(cacheKey, foundFunction);
      return foundFunction;
    } catch (error) {
      console.warn(`Warning: Could not parse controller file ${controllerPath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract detailed route information from a route call expression
   * @param {Object} node - AST node
   * @param {string} method - HTTP method
   * @param {string} basePath - Base path from router mounting
   * @param {string} filePath - Source file path
   */
  extractRouteInfo(node, method, basePath, filePath) {
    const args = node.arguments;
    
    // First argument should be the path
    if (args[0].type !== 'StringLiteral') {
      return null;
    }

    const routePath = args[0].value;
    const fullPath = this.normalizePath(basePath, routePath);

    const routeInfo = {
      method,
      path: fullPath,
      source: filePath,
      params: this.extractPathParams(fullPath),
      queryParams: [],
      bodyParams: [],
      headers: [],
      description: '',
      middlewares: []
    };

    // Analyze middleware and handler functions for additional info
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.type === 'FunctionExpression' || arg.type === 'ArrowFunctionExpression') {
        // Inline function handler
        this.analyzeHandlerFunction(arg, routeInfo);
      } else if (arg.type === 'Identifier') {
        // Controller function reference - try to resolve it
        const controllerFunc = this.findControllerFunction(arg.name, filePath);
        if (controllerFunc) {
          this.analyzeHandlerFunction(controllerFunc, routeInfo);
        }
        routeInfo.middlewares.push(arg.name);
      } else if (arg.type === 'MemberExpression') {
        // Handle: controller.methodName
        if (arg.object && arg.object.type === 'Identifier' && 
            arg.property && arg.property.type === 'Identifier') {
          const objectName = arg.object.name;
          const methodName = arg.property.name;
          
          // Try to resolve the controller method
          const controllerFunc = this.findControllerMethod(objectName, methodName, filePath);
          if (controllerFunc) {
            this.analyzeHandlerFunction(controllerFunc, routeInfo);
          }
          routeInfo.middlewares.push(`${objectName}.${methodName}`);
        }
      }
    }

    // Detect body type based on method (only if not already set by handler analysis)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !routeInfo.bodyType) {
      // Only set default if we found body params
      if (routeInfo.bodyParams.length > 0) {
        routeInfo.bodyType = 'json'; // Default to JSON
      }
    }

    return routeInfo;
  }

  /**
   * Analyze handler function body for req.body, req.query, req.params usage
   * @param {Object} funcNode - Function AST node
   * @param {Object} routeInfo - Route information object
   */
  analyzeHandlerFunction(funcNode, routeInfo) {
    if (!funcNode.body) return;

    // Create a simple visitor to walk the function body
    this.walkNode(funcNode.body, (node) => {
      // Check for destructuring: const { field1, field2 } = req.query
      if (node.type === 'VariableDeclarator' && 
          node.id && node.id.type === 'ObjectPattern' &&
          node.init && node.init.type === 'MemberExpression') {
        
        const properties = node.id.properties || [];
        const obj = node.init.object;
        const prop = node.init.property;
        
        if (obj && obj.name === 'req' && prop) {
          if (prop.name === 'query') {
            // Extract query params from destructuring
            properties.forEach(p => {
              if (p.type === 'ObjectProperty' && p.key && p.key.name) {
                const fieldName = p.key.name;
                if (!routeInfo.queryParams.find(param => param.key === fieldName)) {
                  routeInfo.queryParams.push({
                    key: fieldName,
                    value: '',
                    description: ''
                  });
                }
              }
            });
          } else if (prop.name === 'body') {
            // Extract body params from destructuring
            properties.forEach(p => {
              if (p.type === 'ObjectProperty' && p.key && p.key.name) {
                const fieldName = p.key.name;
                if (!routeInfo.bodyParams.find(param => param.key === fieldName)) {
                  routeInfo.bodyParams.push({
                    key: fieldName,
                    type: 'text',
                    description: ''
                  });
                }
              }
            });
          } else if (prop.name === 'params') {
            // Params are already extracted from path, but we could validate here
          }
        }
      }
      
      // Check for: const file = req.file or const files = req.files
      if (node.type === 'VariableDeclarator' &&
          node.init && node.init.type === 'MemberExpression') {
        const obj = node.init.object;
        const prop = node.init.property;
        
        if (obj && obj.name === 'req' && prop &&
            (prop.name === 'file' || prop.name === 'files')) {
          routeInfo.bodyType = 'formdata';
          // Also try to detect if there are file fields
          if (node.id && node.id.type === 'Identifier') {
            const fileName = node.id.name;
            if (!routeInfo.bodyParams.find(p => p.key === fileName)) {
              routeInfo.bodyParams.push({
                key: fileName,
                type: 'file',
                description: 'File upload field'
              });
            }
          }
        }
      }
      
      // NEW: Check for object literals being created with destructured variables
      // e.g., { customerId, items, shippingAddress } where these came from req.body
      if (node.type === 'ObjectExpression') {
        // Track if this object is being passed to a function
        node.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty' && prop.value && prop.value.type === 'Identifier') {
            const varName = prop.value.name;
            // This is a shorthand property or reference to a variable
            // We need to track where this variable came from
          }
        });
      }
      
      if (node.type !== 'MemberExpression') return;
      
      // Check for req.body.field
      if (
        node.object.type === 'MemberExpression' &&
        node.object.object && node.object.object.name === 'req' &&
        node.object.property && node.object.property.name === 'body' &&
        node.property && node.property.type === 'Identifier'
      ) {
        const fieldName = node.property.name;
        if (!routeInfo.bodyParams.find(p => p.key === fieldName)) {
          routeInfo.bodyParams.push({
            key: fieldName,
            type: 'text',
            description: ''
          });
        }
      }

      // Check for req.query.field
      if (
        node.object.type === 'MemberExpression' &&
        node.object.object && node.object.object.name === 'req' &&
        node.object.property && node.object.property.name === 'query' &&
        node.property && node.property.type === 'Identifier'
      ) {
        const fieldName = node.property.name;
        if (!routeInfo.queryParams.find(p => p.key === fieldName)) {
          routeInfo.queryParams.push({
            key: fieldName,
            value: '',
            description: ''
          });
        }
      }

      // Check for req.file or req.files (multer) - direct access
      if (
        node.object && node.object.name === 'req' &&
        node.property && (node.property.name === 'file' || node.property.name === 'files')
      ) {
        routeInfo.bodyType = 'formdata';
      }
    });
  }

  /**
   * Simple node walker
   * @param {Object} node - AST node
   * @param {Function} callback - Callback function
   */
  walkNode(node, callback) {
    if (!node || typeof node !== 'object') return;
    
    callback(node);
    
    // Walk through all properties
    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'leadingComments' || key === 'trailingComments') {
        continue;
      }
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => this.walkNode(c, callback));
      } else if (child && typeof child === 'object') {
        this.walkNode(child, callback);
      }
    }
  }

  /**
   * Extract path parameters from route path
   * @param {string} path - Route path
   * @returns {Array} Array of path parameters
   */
  extractPathParams(path) {
    const params = [];
    const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = paramRegex.exec(path)) !== null) {
      params.push({
        key: match[1],
        value: '',
        description: ''
      });
    }

    return params;
  }

  /**
   * Normalize and combine base path with route path
   * @param {string} basePath - Base path
   * @param {string} routePath - Route path
   * @returns {string} Normalized full path
   */
  normalizePath(basePath, routePath) {
    if (!basePath) return routePath;
    
    const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const route = routePath.startsWith('/') ? routePath : '/' + routePath;
    
    return base + route;
  }

  /**
   * Get all parsed routes
   * @returns {Array} Array of route objects
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Clear all routes
   */
  clear() {
    this.routes = [];
    this.functionCache.clear();
    this.importMap.clear();
  }
}

module.exports = RouteParser;
