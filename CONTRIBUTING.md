# Contributing to Express Postman Generator

Thank you for your interest in contributing! Here are some ways you can help:

## Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Sample code if possible

## Feature Requests

We'd love to hear your ideas! Please create an issue describing:
- The feature you'd like to see
- Why it would be useful
- Example use cases

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rashid5925/express-postman-generator.git
   cd express-postman-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make your changes

4. Test your changes with the examples:
   ```bash
   node bin/cli.js --project ./examples --name "Test Collection"
   ```

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code structure

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

Some ideas for future contributions:
- TypeScript support
- JSDoc parsing for route descriptions
- Support for more body parsers (XML, GraphQL)
- Validation schema extraction (Joi, Yup, express-validator)
- Request/response examples
- Authentication header detection
- Environment variable extraction

Thank you for contributing! 🎉
