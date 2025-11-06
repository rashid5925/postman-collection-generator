# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-06

### Changed
- Updated installation commands in README.md and QUICKSTART.md to use scoped package name `@rashid5925/express-postman-generator`

## [1.0.0] - 2025-11-06

### Added
- Initial release of Express Postman Generator
- AST-based route parsing using Babel parser
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **Controller function resolution** - Follows `require()` imports to parse controller files
- **Separate controller file support** - Extracts parameters from handlers in different files
- Automatic detection of:
  - Path parameters (`:id`, `:userId`, etc.)
  - Query parameters from `req.query` usage (including destructuring)
  - Body parameters from `req.body` usage (including destructuring)
  - Form-data detection from `req.file` and `req.files`
  - Controller methods accessed as `controller.methodName`
  - Both inline handlers and external controller functions
- Destructuring support for parameter extraction
- Route grouping by base path
- CLI tool with multiple options
- Configuration file support (`.postmanrc.json`)
- Postman Collection v2.1 format output
- Base path inference from file structure
- Examples directory with sample Express app including:
  - Inline route handlers
  - Separate controller files
  - Service layer integration
  - Multiple parameter types

### Features
- Parse Express route files automatically
- Generate ready-to-import Postman collections
- Support for JSON and multipart/form-data body types
- Configurable output path and collection metadata
- File pattern inclusion/exclusion support
- Environment variable support with `{{baseUrl}}`
- DELETE requests with body support (when body params detected)
