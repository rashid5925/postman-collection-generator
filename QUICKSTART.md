# Quick Start Guide

## Installation

```bash
npm install -g express-postman-generator
```

## Usage

### 1. Navigate to your Express.js project

```bash
cd /path/to/your/express/project
```

### 2. Run the generator

```bash
express-postman
```

That's it! Your Postman collection will be generated in the project root.

### 3. Import to Postman

1. Open Postman
2. Click "Import" button (top left)
3. Select the generated `.postman_collection.json` file
4. Click "Import"
5. Your API collection is ready!

## Common Use Cases

### Custom output location

```bash
express-postman --output ./docs/api-collection.json
```

### Specific routes directory

```bash
express-postman --include "routes/**/*.js" --exclude "test/**"
```

### Custom API name and URL

```bash
express-postman --name "My API" --base-url "https://api.myapp.com"
```

### Using a config file

Create `.postmanrc.json` in your project root:

```json
{
  "collectionName": "My API",
  "baseUrl": "https://api.myapp.com",
  "outputPath": "./postman-collection.json",
  "includePatterns": ["routes/**/*.js"],
  "excludePatterns": ["test/**", "**/*.test.js"]
}
```

Then simply run:

```bash
express-postman
```

## What Gets Detected?

### ✅ Automatically Extracted

- **Routes**: All `app.get()`, `router.post()`, etc.
- **Path Parameters**: `:id`, `:userId`, etc.
- **Query Parameters**: from `const { page } = req.query`
- **Body Parameters**: from `const { name, email } = req.body`
- **File Uploads**: from `req.file` or `req.files`

### 📝 Example

```javascript
// Your Express route
router.post('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  // ...
});
```

**Generates:**
- POST request to `/users/:id`
- Path variable: `id`
- JSON body with fields: `name`, `email`

## Next Steps

- Customize the collection in Postman
- Add test scripts
- Set up environments
- Share with your team!

## Need Help?

- Check the [main README](README.md)
- View [examples](examples/)
- Report issues on GitHub
