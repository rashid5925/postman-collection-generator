/**
 * Convert parsed routes to Postman Collection v2.1 format
 */
class PostmanConverter {
  constructor(options = {}) {
    this.collectionName = options.name || 'Express API Collection';
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.description = options.description || 'Generated from Express.js routes';
  }

  /**
   * Convert routes to Postman Collection format
   * @param {Array} routes - Array of route objects from parser
   * @returns {Object} Postman Collection v2.1 JSON
   */
  convert(routes) {
    const collection = {
      info: {
        name: this.collectionName,
        description: this.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: this.groupRoutesByPath(routes),
      variable: [
        {
          key: 'baseUrl',
          value: this.baseUrl,
          type: 'string'
        }
      ]
    };

    return collection;
  }

  /**
   * Group routes by their base path into folders
   * @param {Array} routes - Array of route objects
   * @returns {Array} Array of Postman items/folders
   */
  groupRoutesByPath(routes) {
    const groups = {};

    routes.forEach(route => {
      const parts = route.path.split('/').filter(p => p);
      const groupName = parts.length > 0 ? parts[0] : 'root';

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(this.convertRoute(route));
    });

    // Convert groups to Postman folder structure
    return Object.keys(groups).map(groupName => ({
      name: groupName.charAt(0).toUpperCase() + groupName.slice(1),
      item: groups[groupName]
    }));
  }

  /**
   * Convert a single route to Postman request format
   * @param {Object} route - Route object
   * @returns {Object} Postman request item
   */
  convertRoute(route) {
    const request = {
      method: route.method,
      header: this.buildHeaders(route),
      url: this.buildUrl(route),
      description: route.description || `${route.method} ${route.path}`
    };

    // Add body if applicable
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method) && route.bodyType) {
      request.body = this.buildBody(route);
    }

    return {
      name: this.generateRequestName(route),
      request
    };
  }

  /**
   * Generate a readable name for the request
   * @param {Object} route - Route object
   * @returns {string} Request name
   */
  generateRequestName(route) {
    const pathParts = route.path.split('/').filter(p => p && !p.startsWith(':'));
    const name = pathParts.join(' ').replace(/[_-]/g, ' ');
    
    return `${route.method} ${name || route.path}`;
  }

  /**
   * Build Postman URL object
   * @param {Object} route - Route object
   * @returns {Object} Postman URL object
   */
  buildUrl(route) {
    const pathSegments = route.path.split('/').filter(p => p).map(segment => {
      // Convert :param to {{param}}
      if (segment.startsWith(':')) {
        return `:${segment.slice(1)}`;
      }
      return segment;
    });

    const url = {
      raw: `{{baseUrl}}${route.path}`,
      host: ['{{baseUrl}}'],
      path: pathSegments
    };

    // Add query parameters
    if (route.queryParams && route.queryParams.length > 0) {
      url.query = route.queryParams.map(param => ({
        key: param.key,
        value: param.value || '',
        description: param.description || '',
        disabled: false
      }));
    }

    // Add path variables
    if (route.params && route.params.length > 0) {
      url.variable = route.params.map(param => ({
        key: param.key,
        value: param.value || '',
        description: param.description || ''
      }));
    }

    return url;
  }

  /**
   * Build headers array
   * @param {Object} route - Route object
   * @returns {Array} Array of header objects
   */
  buildHeaders(route) {
    const headers = [];

    // Add default Content-Type for routes with body
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method) && route.bodyType) {
      if (route.bodyType === 'formdata') {
        // Postman auto-sets multipart/form-data for formdata
      } else {
        headers.push({
          key: 'Content-Type',
          value: 'application/json'
        });
      }
    }

    // Add custom headers from route
    if (route.headers && route.headers.length > 0) {
      headers.push(...route.headers);
    }

    return headers;
  }

  /**
   * Build request body
   * @param {Object} route - Route object
   * @returns {Object} Postman body object
   */
  buildBody(route) {
    if (route.bodyType === 'formdata') {
      return {
        mode: 'formdata',
        formdata: route.bodyParams.map(param => ({
          key: param.key,
          value: param.value || '',
          type: param.type || 'text',
          description: param.description || ''
        }))
      };
    }

    // Default to raw JSON
    const bodyObj = {};
    route.bodyParams.forEach(param => {
      bodyObj[param.key] = param.value || '';
    });

    return {
      mode: 'raw',
      raw: JSON.stringify(bodyObj, null, 2),
      options: {
        raw: {
          language: 'json'
        }
      }
    };
  }
}

module.exports = PostmanConverter;
