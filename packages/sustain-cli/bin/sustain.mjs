#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { 
  DockerResourceCollector, 
  ComposeAnalyzer,
  ProjectAnalyzer 
} from '@randish/sustain-core';

const program = new Command();

// Display ASCII art banner
console.log(chalk.green(figlet.textSync('Sustain', { horizontalLayout: 'default' })));
console.log(chalk.green('🌱 Sustainability CLI Tools'));

// Main program setup
program
  .name('sustain')
  .description('CLI for sustainability and resource monitoring')
  .version('0.1.2');

// Resources command
const resourcesCommand = new Command('resources')
  .description('Monitor and analyze system resources')
  .option('--docker', 'Analyze Docker containers')
  .option('--compose', 'Analyze Docker Compose files')
  .option('--system', 'Analyze system resources')
  .action(async (options) => {
    if (!options.docker && !options.compose && !options.system) {
      console.log(chalk.yellow('Please specify a resource type: --docker, --compose, or --system'));
      return;
    }

    if (options.docker) {
      await analyzeDocker();
    }

    if (options.compose) {
      await analyzeCompose();
    }

    if (options.system) {
      await analyzeSystem();
    }
  });

// Scope command
const scopeCommand = new Command('scope')
  .description('Analyze project scope for security, sanity, and code quality')
  .option('--security', 'Run only security analysis')
  .option('--sanity', 'Run only sanity checks')
  .option('--quality', 'Run only code quality analysis')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .action(async (options) => {
    const spinner = ora('Analyzing project scope...').start();
    
    try {
      const analyzer = new ProjectAnalyzer(options.path);
      const analysis = await analyzer.analyze({
        security: options.security,
        sanity: options.sanity,
        quality: options.quality
      });

      spinner.stop();
      displayScopeAnalysis(analysis, options);
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Carbon command
const carbonCommand = new Command('carbon')
  .description('Calculate carbon footprint')
  .action(() => {
    console.log(chalk.yellow('Carbon footprint calculation - Coming soon!'));
  });

// Energy command
const energyCommand = new Command('energy')
  .description('Energy consumption analysis')
  .action(() => {
    console.log(chalk.yellow('Energy consumption analysis - Coming soon!'));
  });

// Report command
const reportCommand = new Command('report')
  .description('Generate sustainability report')
  .action(() => {
    console.log(chalk.yellow('Sustainability report generation - Coming soon!'));
  });

// Add commands to program
program.addCommand(resourcesCommand);
program.addCommand(scopeCommand);
program.addCommand(carbonCommand);
program.addCommand(energyCommand);
program.addCommand(reportCommand);

// Docker analysis function
async function analyzeDocker() {
  const spinner = ora('Analyzing Docker containers...').start();
  
  try {
    const collector = new DockerResourceCollector();
    const data = await collector.collect();
    
    spinner.stop();
    
    if (data.containers.length === 0) {
      console.log(chalk.yellow('No running Docker containers found'));
      return;
    }
    
    console.log(chalk.bold('\n🐳 Docker Container Resources:'));
    
    const table = new Table({
      head: ['Container', 'Status', 'CPU', 'Memory'],
      colWidths: [30, 15, 15, 20]
    });
    
    data.containers.forEach(container => {
      table.push([
        container.name,
        container.status,
        container.cpu,
        container.memory
      ]);
    });
    
    console.log(table.toString());
  } catch (error) {
    spinner.fail('Failed to analyze Docker containers');
    console.error(chalk.red(error.message));
  }
}

// Compose analysis function
async function analyzeCompose() {
  const spinner = ora('Searching for Docker Compose files...').start();
  
  try {
    const analyzer = new ComposeAnalyzer();
    const analyses = await analyzer.analyze();
    
    spinner.stop();
    
    if (analyses.length === 0) {
      console.log(chalk.yellow('No Docker Compose files found'));
      return;
    }
    
    console.log(chalk.bold('\n🐳 Docker Compose Analysis:'));
    
    analyses.forEach(analysis => {
      console.log(chalk.blue(`\n📄 ${analysis.composeFile}`));
      console.log(`   Sustainability Score: ${getScoreColor(analysis.sustainabilityScore)}${analysis.sustainabilityScore}/100${chalk.reset()}`);
      console.log(`   Total Estimated Size: ${analysis.totalEstimatedSize}`);
      console.log(`   Total Estimated Memory: ${analysis.totalEstimatedMemory}`);
      console.log(`   Total Estimated CPU: ${analysis.totalEstimatedCPU}`);
      
      console.log(chalk.bold('   Services:'));
      analysis.services.forEach(service => {
        console.log(`   - ${chalk.cyan(service.name)}:`);
        console.log(`     Image: ${service.image || service.build || 'N/A'}`);
        console.log(`     Est. Size: ${service.estimatedSize}`);
        console.log(`     Est. Memory: ${service.estimatedMemory}`);
        console.log(`     Est. CPU: ${service.estimatedCPU} cores`);
      });
      
      if (analysis.recommendations.length > 0) {
        console.log(chalk.bold('   💡 Recommendations:'));
        analysis.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
      }
    });
  } catch (error) {
    spinner.fail('Failed to analyze Docker Compose files');
    console.error(chalk.red(error.message));
  }
}

// System analysis function
async function analyzeSystem() {
  console.log(chalk.yellow('System resource analysis - Coming soon!'));
}

// Scope analysis display functions
function displayScopeAnalysis(analysis, options) {
  const runAll = !options.security && !options.sanity && !options.quality;

  console.log(chalk.bold('\n📊 Project Scope Analysis\n'));
  console.log(chalk.gray(`Project: ${analysis.projectPath}\n`));

  // Overall score
  if (runAll) {
    const scoreColor = analysis.overall.score >= 80 ? 'green' : 
                      analysis.overall.score >= 60 ? 'yellow' : 'red';
    console.log(chalk.bold('Overall Score: ') + 
                chalk[scoreColor](`${analysis.overall.score}/100`));
    console.log(chalk.gray(analysis.overall.summary + '\n'));
  }

  // Security Analysis
  if (runAll || options.security) {
    displaySecurityAnalysis(analysis.security);
  }

  // Sanity Analysis
  if (runAll || options.sanity) {
    displaySanityAnalysis(analysis.sanity);
  }

  // Code Quality Analysis
  if (runAll || options.quality) {
    displayCodeQualityAnalysis(analysis.codeQuality);
  }
}

function displaySecurityAnalysis(security) {
  console.log(chalk.bold.blue('\n🔒 Security Analysis'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const scoreColor = security.score >= 80 ? 'green' : 
                    security.score >= 60 ? 'yellow' : 'red';
  console.log(chalk.bold('Score: ') + chalk[scoreColor](`${security.score}/100`));

  if (security.issues.length > 0) {
    console.log(chalk.bold('\nIssues Found:'));
    
    const table = new Table({
      head: ['Severity', 'Type', 'File', 'Message'],
      colWidths: [10, 20, 30, 40],
      style: {
        head: ['cyan']
      }
    });

    security.issues.forEach(issue => {
      const severityColor = issue.severity === 'high' ? 'red' :
                           issue.severity === 'medium' ? 'yellow' : 'gray';
      table.push([
        chalk[severityColor](issue.severity.toUpperCase()),
        issue.type,
        issue.file + (issue.line ? `:${issue.line}` : ''),
        issue.message
      ]);
    });

    console.log(table.toString());
  } else {
    console.log(chalk.green('✓ No security issues found'));
  }

  if (security.recommendations.length > 0) {
    console.log(chalk.bold('\n💡 Recommendations:'));
    security.recommendations.forEach(rec => {
      console.log(chalk.gray('  • ') + rec);
    });
  }
}

function displaySanityAnalysis(sanity) {
  console.log(chalk.bold.yellow('\n✨ Sanity Checks'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const scoreColor = sanity.score >= 80 ? 'green' : 
                    sanity.score >= 60 ? 'yellow' : 'red';
  console.log(chalk.bold('Score: ') + chalk[scoreColor](`${sanity.score}/100`));

  if (sanity.issues.length > 0) {
    console.log(chalk.bold('\nIssues Found:'));
    
    const table = new Table({
      head: ['Type', 'File', 'Message'],
      colWidths: [25, 25, 50],
      style: {
        head: ['cyan']
      }
    });

    sanity.issues.forEach(issue => {
      table.push([
        issue.type,
        issue.file,
        issue.message
      ]);
    });

    console.log(table.toString());
  } else {
    console.log(chalk.green('✓ Project structure looks good'));
  }

  if (sanity.recommendations.length > 0) {
    console.log(chalk.bold('\n💡 Recommendations:'));
    sanity.recommendations.forEach(rec => {
      console.log(chalk.gray('  • ') + rec);
    });
  }
}

function displayCodeQualityAnalysis(quality) {
  console.log(chalk.bold.magenta('\n🍝 Code Quality Analysis'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const scoreColor = quality.score >= 80 ? 'green' : 
                    quality.score >= 60 ? 'yellow' : 'red';
  console.log(chalk.bold('Score: ') + chalk[scoreColor](`${quality.score}/100`));

  if (quality.complexFiles.length > 0) {
    console.log(chalk.bold('\nComplex Files (Potential Spaghetti Code):'));
    
    const table = new Table({
      head: ['File', 'Complexity', 'Lines', 'Functions', 'Issues'],
      colWidths: [30, 12, 8, 12, 38],
      style: {
        head: ['cyan']
      }
    });

    quality.complexFiles.forEach(file => {
      const complexityColor = file.complexity > 20 ? 'red' :
                             file.complexity > 15 ? 'yellow' : 'white';
      table.push([
        file.file,
        chalk[complexityColor](file.complexity.toString()),
        file.lines.toString(),
        file.functions.toString(),
        file.issues.length > 0 ? file.issues[0] : 'None'
      ]);
    });

    console.log(table.toString());
  } else {
    console.log(chalk.green('✓ Code complexity is within acceptable limits'));
  }

  if (quality.recommendations.length > 0) {
    console.log(chalk.bold('\n💡 Recommendations:'));
    quality.recommendations.forEach(rec => {
      console.log(chalk.gray('  • ') + rec);
    });
  }
}

// Helper function for score colors
function getScoreColor(score) {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  return chalk.red;
}

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log('\nAvailable commands:');
  console.log('  sustain resources    - Monitor system resources');
  console.log('  sustain scope        - Analyze project scope');
  console.log('  sustain carbon       - Calculate carbon footprint');
  console.log('  sustain energy       - Energy consumption analysis');
  console.log('  sustain report       - Generate sustainability report');
  console.log('\nRun sustain <command> --help for detailed usage');
}