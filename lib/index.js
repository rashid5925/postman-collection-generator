const RouteParser = require('./parser');
const PostmanConverter = require('./converter');
const { glob } = require('glob');
const fs = require('fs');
const path = require('path');

/**
 * Main generator class
 */
class PostmanGenerator {
  constructor(options = {}) {
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      outputPath: options.outputPath || null,
      collectionName: options.collectionName || 'Express API Collection',
      baseUrl: options.baseUrl || 'http://localhost:3000',
      description: options.description || 'Generated from Express.js routes',
      includePatterns: options.includePatterns || ['**/*.js', '!node_modules/**'],
      excludePatterns: options.excludePatterns || ['node_modules/**', 'test/**', 'tests/**']
    };
  }

  /**
   * Generate Postman collection from Express.js project
   * @returns {Promise<string>} Path to generated collection file
   */
  async generate() {
    console.log('🔍 Scanning for route files...');
    
    // Find all JavaScript files
    const files = await this.findRouteFiles();
    console.log(`📁 Found ${files.length} files to analyze`);

    // Parse routes
    console.log('🔬 Parsing routes...');
    const parser = new RouteParser();
    files.forEach(file => {
      parser.parseFile(file);
    });

    const routes = parser.getRoutes();
    console.log(`✅ Extracted ${routes.length} routes`);

    if (routes.length === 0) {
      console.warn('⚠️  No routes found. Make sure your Express routes are in the scanned files.');
      return null;
    }

    // Convert to Postman format
    console.log('🔄 Converting to Postman collection...');
    const converter = new PostmanConverter({
      name: this.options.collectionName,
      baseUrl: this.options.baseUrl,
      description: this.options.description
    });

    const collection = converter.convert(routes);

    // Save to file
    const outputPath = this.getOutputPath();
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
    console.log(`✨ Collection saved to: ${outputPath}`);

    return outputPath;
  }

  /**
   * Find route files in the project
   * @returns {Promise<Array>} Array of file paths
   */
  async findRouteFiles() {
    const patterns = this.options.includePatterns;
    const ignore = this.options.excludePatterns;

    const files = await glob(patterns, {
      cwd: this.options.projectPath,
      ignore,
      absolute: true
    });

    return files;
  }

  /**
   * Get output path for the collection file
   * @returns {string} Output file path
   */
  getOutputPath() {
    if (this.options.outputPath) {
      return path.resolve(this.options.projectPath, this.options.outputPath);
    }

    const fileName = `${this.options.collectionName.toLowerCase().replace(/\s+/g, '-')}.postman_collection.json`;
    return path.resolve(this.options.projectPath, fileName);
  }

  /**
   * Load configuration from file
   * @param {string} configPath - Path to config file
   * @returns {Object} Configuration object
   */
  static loadConfig(configPath) {
    try {
      const fullPath = path.resolve(process.cwd(), configPath);
      if (fs.existsSync(fullPath)) {
        const config = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        console.log(`📝 Loaded configuration from ${configPath}`);
        return config;
      }
    } catch (error) {
      console.warn(`⚠️  Could not load config from ${configPath}: ${error.message}`);
    }
    return {};
  }
}

module.exports = PostmanGenerator;
