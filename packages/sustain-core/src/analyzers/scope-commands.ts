import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { ProjectAnalyzer, ProjectAnalysis } from '@randish/sustain-core';

export function createScopeCommand() {
  const command = new Command('scope')
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
        displayAnalysis(analysis, options);
      } catch (error: any) {
        spinner.fail('Analysis failed');
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });

  return command;
}

function displayAnalysis(analysis: ProjectAnalysis, options: any) {
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

function displaySecurityAnalysis(security: any) {
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

    security.issues.forEach((issue: any) => {
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
    security.recommendations.forEach((rec: string) => {
      console.log(chalk.gray('  • ') + rec);
    });
  }
}

function displaySanityAnalysis(sanity: any) {
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

    sanity.issues.forEach((issue: any) => {
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
    sanity.recommendations.forEach((rec: string) => {
      console.log(chalk.gray('  • ') + rec);
    });
  }
}

function displayCodeQualityAnalysis(quality: any) {
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

    quality.complexFiles.forEach((file: any) => {
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
    quality.recommendations.forEach((rec: string) => {
      console.log(chalk.gray('  • ') + rec);
    });
  }
}