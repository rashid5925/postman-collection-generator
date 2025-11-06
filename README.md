# Express Postman Generator

> Generate Postman collections from your Express.js routes with a single command! 🚀

No more manual API documentation pain. This tool automatically analyzes your Express.js application, extracts all routes, and generates a ready-to-use Postman collection.

## Features

- 🔍 **Automatic Route Detection** - Scans your Express.js project and finds all routes
- 📊 **Smart Parsing** - Uses AST parsing to understand route handlers, parameters, query strings, and body data
- 🎯 **Controller Support** - Follows function references to controller files and extracts parameters
- 📝 **Complete Information** - Extracts path params, query params, body params, and detects form-data vs JSON
- 📁 **Organized Structure** - Groups routes into folders by endpoint prefix
- ⚙️ **Configurable** - Customize via CLI options or config file
- 🎯 **Zero Config** - Works out of the box with sensible defaults

## Installation

### Global Installation (Recommended)

```bash
npm install -g @rashid5925/express-postman-generator
```

### Local Installation

```bash
npm install --save-dev @rashid5925/express-postman-generator
```

### Use with npx (No Installation)

```bash
npx @rashid5925/express-postman-generator
```

## Quick Start

Navigate to your Express.js project directory and run:

```bash
express-postman
```

That's it! Your Postman collection will be generated and saved.

## Usage

### Basic Usage

```bash
# Generate collection in current directory
express-postman

# Specify project path
express-postman --project ./my-express-app

# Custom output path
express-postman --output ./docs/api-collection.json

# Custom collection name
express-postman --name "My Awesome API"

# Custom base URL
express-postman --base-url "https://api.myapp.com"
```

### CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--project <path>` | `-p` | Path to Express.js project | Current directory |
| `--output <path>` | `-o` | Output path for collection file | `{collection-name}.postman_collection.json` |
| `--name <name>` | `-n` | Collection name | `Express API Collection` |
| `--base-url <url>` | `-b` | Base URL for API | `http://localhost:3000` |
| `--description <desc>` | `-d` | Collection description | `Generated from Express.js routes` |
| `--config <path>` | `-c` | Path to config file | `.postmanrc.json` |
| `--include <patterns...>` | `-i` | File patterns to include | `**/*.js` |
| `--exclude <patterns...>` | `-e` | File patterns to exclude | `node_modules/**, test/**` |

### Configuration File

Create a `.postmanrc.json` file in your project root for persistent configuration:

```json
{
  "collectionName": "My API Collection",
  "baseUrl": "http://localhost:3000",
  "description": "API endpoints for my Express.js application",
  "outputPath": "./postman-collection.json",
  "includePatterns": [
    "routes/**/*.js",
    "src/routes/**/*.js",
    "api/**/*.js"
  ],
  "excludePatterns": [
    "node_modules/**",
    "test/**",
    "tests/**",
    "**/*.test.js",
    "**/*.spec.js"
  ]
}
```

Then simply run:

```bash
express-postman
```

## How It Works

The generator works in three steps:

1. **🔍 Route Discovery** - Scans your project files for Express route definitions
2. **🔬 Smart Analysis** - Uses Babel AST parser to analyze:
   - HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
   - Route paths and parameters
   - **Controller functions** - Follows `require()` to find handlers in separate files
   - Request body usage (`req.body.*`)
   - Query parameters (`req.query.*`)
   - Path parameters (`:id`, `:userId`, etc.)
   - File uploads (detects `req.file` / `req.files` for multipart form-data)
3. **📦 Collection Generation** - Converts parsed routes to Postman Collection v2.1 format

## Examples

### Example Express.js Route File

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

// GET /users
router.get('/', (req, res) => {
  const { page, limit } = req.query;
  // ... handler code
});

// GET /users/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // ... handler code
});

// POST /users
router.post('/', (req, res) => {
  const { name, email, age } = req.body;
  // ... handler code
});

module.exports = router;
```

### Example with Controller Functions

```javascript
// routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');

router.get('/', orderController.getAllOrders);
router.post('/', orderController.createOrder);

module.exports = router;
```

```javascript
// controller/orderController.js
const getAllOrders = (req, res) => {
  const { status, page, limit } = req.query;
  // Business logic here
  res.json({ orders: [] });
};

const createOrder = (req, res) => {
  const { customerId, items, shippingAddress } = req.body;
  // Create order logic
  res.status(201).json({ order: {} });
};

module.exports = { getAllOrders, createOrder };
```

**The generator will:**
- Follow the `require()` to find `orderController.js`
- Extract parameters from controller functions
- Generate proper Postman requests with all parameters!

### Generated Postman Collection

The above routes will generate a Postman collection with:

- **GET /users** - with query parameters: `page`, `limit`
- **GET /users/:id** - with path parameter: `id`
- **POST /users** - with JSON body: `name`, `email`, `age`
- **PUT /users/:id** - with path parameter `id` and JSON body: `name`, `email`
- **DELETE /users/:id** - with path parameter: `id`

All organized in a "Users" folder with proper request configurations.

## Supported Features

### ✅ Automatically Detected

- HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Path parameters (`:userId`, `:id`, etc.)
- Query parameters accessed via `req.query.paramName`
- Body parameters accessed via `req.body.fieldName`
- Form-data detection (when `req.file` or `req.files` is used)
- Route grouping by base path

### 🔄 Coming Soon

- TypeScript support
- JSDoc comment parsing for descriptions
- Request/response examples
- Authentication/authorization detection
- Validation schema extraction (express-validator, Joi, etc.)
- Environment variables

## Importing to Postman

1. Open Postman
2. Click "Import" button
3. Select the generated `.postman_collection.json` file
4. Start testing your API! 🎉

## Programmatic Usage

You can also use the generator programmatically in your Node.js scripts:

```javascript
const PostmanGenerator = require('express-postman-generator');

async function generateCollection() {
  const generator = new PostmanGenerator({
    projectPath: './my-express-app',
    collectionName: 'My API',
    baseUrl: 'http://localhost:3000',
    outputPath: './api-collection.json'
  });

  const outputPath = await generator.generate();
  console.log(`Collection saved to: ${outputPath}`);
}

generateCollection();
```

## Troubleshooting

### No routes found

- Make sure your route files use standard Express.js syntax
- Check that your files match the include patterns
- Verify files aren't excluded by exclude patterns

### Missing parameters

- The generator detects parameters by analyzing `req.body`, `req.query`, and `req.params` usage
- Make sure you're accessing these properties in your route handlers
- For better detection, destructure parameters in the handler function

### Incorrect body type

- The generator defaults to JSON for POST/PUT/PATCH
- If you use `req.file` or `req.files`, it will detect form-data
- You can manually adjust the collection after generation if needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Created to make API documentation easier for Express.js developers! 🚀

---

**Made with ❤️ for backend developers who hate writing API docs**
