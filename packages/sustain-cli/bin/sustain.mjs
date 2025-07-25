#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Import core functionality
import { DockerResourceCollector } from '@randish/sustain-core';

// Setup for ESM
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json
const packageJson = JSON.parse(
  fs.readFileSync(join(__dirname, '../package.json'), 'utf8')
);

// Display banner
console.log(
  chalk.green(
    figlet.textSync('Sustain', {
      horizontalLayout: 'full',
      font: 'Standard'
    })
  )
);
console.log(chalk.blue('🌱 Sustainability CLI Tools\n'));

// Initialize program
program
  .name('sustain')
  .description('CLI for sustainability and resource monitoring')
  .version(packageJson.version);

// Default command - show overview
program
  .action(() => {
    console.log(chalk.yellow('Available commands:\n'));
    console.log('  ' + chalk.green('sustain resources') + '    - Monitor system resources');
    console.log('  ' + chalk.green('sustain carbon') + '       - Calculate carbon footprint');
    console.log('  ' + chalk.green('sustain energy') + '       - Energy consumption analysis');
    console.log('  ' + chalk.green('sustain report') + '       - Generate sustainability report');
    console.log('\nRun ' + chalk.cyan('sustain <command> --help') + ' for detailed usage');
  });

// Resources command
program
  .command('resources')
  .alias('res')
  .description('Monitor and analyze system resources')
  .option('-d, --docker', 'Show Docker container resources')
  .option('-s, --system', 'Show system resources')
  .option('-f, --format <format>', 'Output format (table, json, csv)', 'table')
  .option('--watch', 'Watch resources in real-time')
  .action(async (options) => {
    try {
      if (options.docker) {
        const collector = new DockerResourceCollector();
        const resources = await collector.collect();
        
        if (options.format === 'json') {
          console.log(JSON.stringify(resources, null, 2));
        } else {
          // Table format
          console.log(chalk.cyan('\n📊 Docker Resources:\n'));
          if (resources.containers && resources.containers.length > 0) {
            resources.containers.forEach(container => {
              console.log(chalk.yellow(`Container: ${container.name}`));
              console.log(`  CPU: ${container.cpu || 'N/A'}`);
              console.log(`  Memory: ${container.memory || 'N/A'}`);
              console.log(`  Status: ${container.status || 'N/A'}\n`);
            });
          } else {
            console.log(chalk.gray('No Docker containers found or Docker is not running.'));
          }
        }
      } else {
        console.log(chalk.yellow('Please specify a resource type: --docker or --system'));
      }
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
      process.exit(1);
    }
  });

// Carbon command
program
  .command('carbon')
  .description('Calculate carbon footprint')
  .option('-t, --type <type>', 'Calculation type (computing, travel, energy)')
  .option('-i, --interactive', 'Interactive mode')
  .action((options) => {
    console.log(chalk.green('🌍 Carbon Footprint Calculator'));
    console.log(chalk.gray('Coming soon...'));
    // TODO: Implement carbon calculation
  });

// Energy command
program
  .command('energy')
  .description('Analyze energy consumption')
  .option('-p, --period <period>', 'Time period (day, week, month)', 'day')
  .action((options) => {
    console.log(chalk.yellow('⚡ Energy Analysis'));
    console.log(chalk.gray('Coming soon...'));
    // TODO: Implement energy analysis
  });

// Report command
program
  .command('report')
  .description('Generate sustainability report')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Report format (pdf, html, markdown)', 'markdown')
  .action((options) => {
    console.log(chalk.blue('📄 Generating Sustainability Report'));
    console.log(chalk.gray('Coming soon...'));
    // TODO: Implement report generation
  });

// Global options
program
  .option('--no-color', 'Disable colored output')
  .option('--verbose', 'Verbose output')
  .option('--quiet', 'Minimal output');

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.unknownCommand') {
    console.error(chalk.red('\nUnknown command:', err.message));
    console.log('\nRun ' + chalk.cyan('sustain --help') + ' to see available commands');
  } else {
    console.error(chalk.red('Error:', err.message));
  }
  process.exit(1);
}