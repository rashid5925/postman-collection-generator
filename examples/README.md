# Examples

This directory contains example Express.js applications to demonstrate the generator.

## Running the Example

1. Navigate to the examples directory:
   ```bash
   cd examples
   ```

2. Install dependencies (if any):
   ```bash
   npm install
   ```

3. Run the generator from the project root:
   ```bash
   cd ..
   node bin/cli.js --project ./examples --name "Example API"
   ```

## Example Routes

### Users (`/api/users`)
- GET `/` - List all users with pagination
- GET `/:id` - Get user by ID
- POST `/` - Create new user
- PUT `/:id` - Update user
- DELETE `/:id` - Delete user
- POST `/:id/avatar` - Upload user avatar (multipart/form-data)

### Products (`/api/products`)
- GET `/` - List all products with filters
- GET `/:productId` - Get product by ID
- POST `/` - Create new product
- PATCH `/:productId` - Update product
- DELETE `/:productId` - Delete product

### Auth (`/api/auth`)
- POST `/login` - User login
- POST `/register` - User registration
- POST `/logout` - User logout
- POST `/password-reset` - Request password reset

## Generated Collection

After running the generator, you'll get a Postman collection file that includes:

- All routes organized by endpoint prefix
- Proper HTTP methods
- Path parameters (`:id`, `:productId`)
- Query parameters (`page`, `limit`, `category`, etc.)
- Request bodies for POST/PUT/PATCH requests
- Form-data configuration for file uploads

Import the generated JSON file into Postman and start testing!
