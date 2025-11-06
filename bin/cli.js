#!/usr/bin/env node

const { Command } = require('commander');
const PostmanGenerator = require('../lib/index');
const path = require('path');
const fs = require('fs');

const program = new Command();

program
  .name('express-postman')
  .description('Generate Postman collections from Express.js routes')
  .version('1.0.0')
  .option('-p, --project <path>', 'Path to Express.js project', process.cwd())
  .option('-o, --output <path>', 'Output path for collection file')
  .option('-n, --name <name>', 'Collection name', 'Express API Collection')
  .option('-b, --base-url <url>', 'Base URL for API', 'http://localhost:3000')
  .option('-d, --description <desc>', 'Collection description', 'Generated from Express.js routes')
  .option('-c, --config <path>', 'Path to config file (.postmanrc.json)')
  .option('-i, --include <patterns...>', 'File patterns to include (default: **/*.js)')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude (default: node_modules/**, test/**)')
  .action(async (options) => {
    try {
      console.log('🚀 Express Postman Generator\n');

      // Load config file if specified
      let config = {};
      if (options.config) {
        config = PostmanGenerator.loadConfig(options.config);
      } else {
        // Try to load default config file
        const defaultConfigPath = path.join(process.cwd(), '.postmanrc.json');
        if (fs.existsSync(defaultConfigPath)) {
          config = PostmanGenerator.loadConfig('.postmanrc.json');
        }
      }

      // Merge options (CLI options take precedence over config file)
      const generatorOptions = {
        projectPath: options.project || config.projectPath || process.cwd(),
        outputPath: options.output || config.outputPath,
        collectionName: options.name || config.collectionName || 'Express API Collection',
        baseUrl: options.baseUrl || config.baseUrl || 'http://localhost:3000',
        description: options.description || config.description || 'Generated from Express.js routes',
        includePatterns: options.include || config.includePatterns || ['**/*.js', '!node_modules/**'],
        excludePatterns: options.exclude || config.excludePatterns || ['node_modules/**', 'test/**', 'tests/**']
      };

      // Create generator and generate collection
      const generator = new PostmanGenerator(generatorOptions);
      const outputPath = await generator.generate();

      if (outputPath) {
        console.log('\n✅ Done! You can now import the collection into Postman.');
      } else {
        console.log('\n❌ Failed to generate collection.');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  });

program.parse();
