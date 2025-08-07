import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

interface SecurityIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  message: string;
}

interface CodeComplexity {
  file: string;
  complexity: number;
  lines: number;
  functions: number;
  issues: string[];
}

interface SanityIssue {
  type: string;
  file: string;
  message: string;
}

export interface ProjectAnalysis {
  projectPath: string;
  security: {
    score: number;
    issues: SecurityIssue[];
    recommendations: string[];
    analysisTime?: number;
    error?: string;
  };
  sanity: {
    score: number;
    issues: SanityIssue[];
    recommendations: string[];
    analysisTime?: number;
    error?: string;
  };
  codeQuality: {
    score: number;
    complexFiles: CodeComplexity[];
    recommendations: string[];
    analysisTime?: number;
    error?: string;
  };
  overall: {
    score: number;
    summary: string;
  };
}

export class ProjectAnalyzer {
  private projectPath: string;
  private skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor'];
  private maxFileSize = 10 * 1024 * 1024; // 10MB max file size
  private timeout = 30000; // 30 second timeout
  
  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
  }

  async analyze(options?: { security?: boolean; sanity?: boolean; quality?: boolean }): Promise<ProjectAnalysis> {
    const runAll = !options || (!options.security && !options.sanity && !options.quality);
    
    const analysis: ProjectAnalysis = {
      projectPath: this.projectPath,
      security: { score: 100, issues: [], recommendations: [] },
      sanity: { score: 100, issues: [], recommendations: [] },
      codeQuality: { score: 100, complexFiles: [], recommendations: [] },
      overall: { score: 100, summary: '' }
    };

    // Validate project path first
    if (!await this.validateProjectPath()) {
      throw new Error(`Invalid project path: ${this.projectPath}`);
    }

    const analysisPromises: Promise<void>[] = [];

    if (runAll || options?.security) {
      analysisPromises.push(this.runSecurityAnalysis(analysis));
    }

    if (runAll || options?.sanity) {
      analysisPromises.push(this.runSanityAnalysis(analysis));
    }

    if (runAll || options?.quality) {
      analysisPromises.push(this.runQualityAnalysis(analysis));
    }

    // Run all analyses in parallel but handle individual failures
    await Promise.allSettled(analysisPromises);

    // Calculate overall score (only from successful analyses)
    this.calculateOverallScore(analysis);

    return analysis;
  }

  private async validateProjectPath(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.projectPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  private async runSecurityAnalysis(analysis: ProjectAnalysis): Promise<void> {
    const startTime = Date.now();
    try {
      analysis.security = await this.analyzeSecurityAsync();
      analysis.security.analysisTime = Date.now() - startTime;
    } catch (error) {
      console.warn(`Security analysis failed: ${error.message}`);
      analysis.security = {
        score: 50,
        issues: [],
        recommendations: ['Manual security review needed due to analysis failure'],
        analysisTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async runSanityAnalysis(analysis: ProjectAnalysis): Promise<void> {
    const startTime = Date.now();
    try {
      analysis.sanity = await this.analyzeSanity();
      analysis.sanity.analysisTime = Date.now() - startTime;
    } catch (error) {
      console.warn(`Sanity analysis failed: ${error.message}`);
      analysis.sanity = {
        score: 50,
        issues: [],
        recommendations: ['Manual project structure review needed due to analysis failure'],
        analysisTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async runQualityAnalysis(analysis: ProjectAnalysis): Promise<void> {
    const startTime = Date.now();
    try {
      analysis.codeQuality = await this.analyzeCodeQuality();
      analysis.codeQuality.analysisTime = Date.now() - startTime;
    } catch (error) {
      console.warn(`Code quality analysis failed: ${error.message}`);
      analysis.codeQuality = {
        score: 50,
        complexFiles: [],
        recommendations: ['Manual code review needed due to analysis failure'],
        analysisTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private calculateOverallScore(analysis: ProjectAnalysis): void {
    const validScores: number[] = [];
    
    if (!analysis.security.error) validScores.push(analysis.security.score);
    if (!analysis.sanity.error) validScores.push(analysis.sanity.score);
    if (!analysis.codeQuality.error) validScores.push(analysis.codeQuality.score);
    
    if (validScores.length === 0) {
      analysis.overall.score = 0;
      analysis.overall.summary = 'Analysis failed - manual review required';
      return;
    }
    
    analysis.overall.score = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
    analysis.overall.summary = this.generateSummary(analysis);
  }

  private async analyzeSecurityAsync(): Promise<ProjectAnalysis['security']> {
    const issues: SecurityIssue[] = [];
    
    try {
      const files = await this.getAllFiles();
      
      // Process files in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(file => this.analyzeFileForSecurity(file, issues)));
      }

      // Check for vulnerable dependencies with timeout
      await this.checkVulnerableDependencies(issues);

    } catch (error) {
      throw new Error(`Security analysis failed: ${error.message}`);
    }

    const score = Math.max(0, 100 - (issues.filter(i => i.severity === 'high').length * 20) - 
                                    (issues.filter(i => i.severity === 'medium').length * 10));

    const recommendations = this.generateSecurityRecommendations(issues);

    return { score, issues, recommendations };
  }

  private async analyzeFileForSecurity(file: string, issues: SecurityIssue[]): Promise<void> {
    try {
      // Check file size before reading
      const stats = await fs.stat(file);
      if (stats.size > this.maxFileSize) {
        console.warn(`Skipping large file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }

      const content = await fs.readFile(file, 'utf8');
      
      // Check for hardcoded secrets
      const secretPatterns = [
        { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-api-key' },
        { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-password' },
        { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-secret' },
        { pattern: /token\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-token' },
        { pattern: /aws_access_key_id/gi, type: 'aws-credentials' },
        { pattern: /private[_-]?key/gi, type: 'private-key' }
      ];

      const lines = content.split('\n');
      lines.forEach((line, index) => {
        for (const { pattern, type } of secretPatterns) {
          if (pattern.test(line) && !line.includes('process.env') && !line.includes('example')) {
            issues.push({
              type,
              severity: 'high',
              file: file.replace(this.projectPath + '/', ''),
              line: index + 1,
              message: `Potential ${type.replace('-', ' ')} found`
            });
          }
        }
      });

      // Check for unsafe practices
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        this.checkUnsafePractices(file, content, issues);
      }

    } catch (error) {
      console.warn(`Failed to analyze file ${file}: ${error.message}`);
    }
  }

  private checkUnsafePractices(file: string, content: string, issues: SecurityIssue[]): void {
    if (content.includes('eval(')) {
      issues.push({
        type: 'unsafe-eval',
        severity: 'high',
        file: file.replace(this.projectPath + '/', ''),
        message: 'Use of eval() is a security risk'
      });
    }

    if (content.includes('innerHTML')) {
      issues.push({
        type: 'unsafe-html',
        severity: 'medium',
        file: file.replace(this.projectPath + '/', ''),
        message: 'innerHTML can lead to XSS vulnerabilities'
      });
    }

    if (content.match(/require\s*\([`'"]\s*\$\{/)) {
      issues.push({
        type: 'dynamic-require',
        severity: 'medium',
        file: file.replace(this.projectPath + '/', ''),
        message: 'Dynamic require() can be a security risk'
      });
    }
  }

  private async checkVulnerableDependencies(issues: SecurityIssue[]): Promise<void> {
    const packageJsonPath = join(this.projectPath, 'package.json');
    if (!(await this.fileExists(packageJsonPath))) {
      return;
    }

    try {
      // Use timeout for npm audit
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('npm audit timeout')), this.timeout);
      });

      const auditPromise = new Promise((resolve) => {
        try {
          execSync('npm audit --json', { cwd: this.projectPath, stdio: 'pipe' });
          resolve(null);
        } catch (e: any) {
          const output = e.stdout?.toString() || '';
          resolve(output);
        }
      });

      const output = await Promise.race([auditPromise, timeoutPromise]) as string | null;

      if (output) {
        try {
          const audit = JSON.parse(output);
          if (audit.metadata?.vulnerabilities) {
            const vulns = audit.metadata.vulnerabilities;
            if (vulns.high > 0) {
              issues.push({
                type: 'vulnerable-dependencies',
                severity: 'high',
                file: 'package.json',
                message: `${vulns.high} high severity vulnerabilities in dependencies`
              });
            }
            if (vulns.moderate > 0) {
              issues.push({
                type: 'vulnerable-dependencies',
                severity: 'medium',
                file: 'package.json',
                message: `${vulns.moderate} moderate severity vulnerabilities in dependencies`
              });
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse npm audit output');
        }
      }
    } catch (error) {
      console.warn(`npm audit failed: ${error.message}`);
    }
  }

  private async analyzeSanity(): Promise<ProjectAnalysis['sanity']> {
    const issues: SanityIssue[] = [];
    
    try {
      // Check for README
      if (!await this.fileExists(join(this.projectPath, 'README.md'))) {
        issues.push({
          type: 'missing-readme',
          file: 'README.md',
          message: 'No README.md file found'
        });
      }

      // Check for .gitignore
      if (!await this.fileExists(join(this.projectPath, '.gitignore'))) {
        issues.push({
          type: 'missing-gitignore',
          file: '.gitignore',
          message: 'No .gitignore file found'
        });
      }

      // Check package.json
      await this.checkPackageJson(issues);

      // Check for tests
      const hasTests = await this.hasTestFiles();
      if (!hasTests) {
        issues.push({
          type: 'no-tests',
          file: 'project',
          message: 'No test files found in the project'
        });
      }

      // Check for environment example
      if (await this.fileExists(join(this.projectPath, '.env'))) {
        if (!await this.fileExists(join(this.projectPath, '.env.example'))) {
          issues.push({
            type: 'missing-env-example',
            file: '.env.example',
            message: 'Found .env but no .env.example file'
          });
        }
      }

      // Check for large files
      await this.checkLargeFiles(issues);

    } catch (error) {
      throw new Error(`Sanity analysis failed: ${error.message}`);
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    const recommendations = this.generateSanityRecommendations(issues);

    return { score, issues, recommendations };
  }

  private async checkPackageJson(issues: SanityIssue[]): Promise<void> {
    const packageJsonPath = join(this.projectPath, 'package.json');
    if (!(await this.fileExists(packageJsonPath))) {
      return;
    }

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.name) {
        issues.push({
          type: 'package-json-incomplete',
          file: 'package.json',
          message: 'Missing "name" field in package.json'
        });
      }

      if (!packageJson.version) {
        issues.push({
          type: 'package-json-incomplete',
          file: 'package.json',
          message: 'Missing "version" field in package.json'
        });
      }

      if (!packageJson.description) {
        issues.push({
          type: 'package-json-incomplete',
          file: 'package.json',
          message: 'Missing "description" field in package.json'
        });
      }

      if (!packageJson.scripts || Object.keys(packageJson.scripts).length === 0) {
        issues.push({
          type: 'no-scripts',
          file: 'package.json',
          message: 'No scripts defined in package.json'
        });
      }
    } catch (error) {
      issues.push({
        type: 'invalid-package-json',
        file: 'package.json',
        message: 'Invalid or corrupted package.json file'
      });
    }
  }

  private async checkLargeFiles(issues: SanityIssue[]): Promise<void> {
    try {
      const files = await this.getAllFiles();
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          if (stats.size > 1024 * 1024 * 10) { // 10MB
            issues.push({
              type: 'large-file',
              file: file.replace(this.projectPath + '/', ''),
              message: `File is very large (${(stats.size / 1024 / 1024).toFixed(2)}MB)`
            });
          }
        } catch (error) {
          // Skip files we can't stat
          continue;
        }
      }
    } catch (error) {
      console.warn(`Failed to check file sizes: ${error.message}`);
    }
  }

  private async analyzeCodeQuality(): Promise<ProjectAnalysis['codeQuality']> {
    const complexFiles: CodeComplexity[] = [];
    
    try {
      const files = await this.getAllCodeFiles();

      // Process files in batches
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(file => this.analyzeFileComplexitySafe(file))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const analysis = result.value;
            if (analysis.complexity > 10 || analysis.issues.length > 0) {
              complexFiles.push(analysis);
            }
          } else if (result.status === 'rejected') {
            console.warn(`Failed to analyze ${batch[index]}: ${result.reason}`);
          }
        });
      }

      // Sort by complexity
      complexFiles.sort((a, b) => b.complexity - a.complexity);

    } catch (error) {
      throw new Error(`Code quality analysis failed: ${error.message}`);
    }

    let score = 100;
    complexFiles.forEach(file => {
      if (file.complexity > 20) score -= 10;
      else if (file.complexity > 15) score -= 5;
      else if (file.complexity > 10) score -= 2;
    });

    const recommendations = this.generateQualityRecommendations(complexFiles);

    return {
      score: Math.max(0, score),
      complexFiles: complexFiles.slice(0, 10), // Top 10 most complex
      recommendations
    };
  }

  private async analyzeFileComplexitySafe(filePath: string): Promise<CodeComplexity | null> {
    try {
      // Check file size before reading
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        console.warn(`Skipping large file for complexity analysis: ${filePath}`);
        return null;
      }

      const content = await fs.readFile(filePath, 'utf8');
      return this.analyzeFileComplexity(filePath, content);
    } catch (error) {
      throw new Error(`Failed to analyze file complexity for ${filePath}: ${error.message}`);
    }
  }

  private analyzeFileComplexity(filePath: string, content: string): CodeComplexity {
    const lines = content.split('\n');
    const issues: string[] = [];
    let complexity = 0;
    let functionCount = 0;

    // Count functions and complexity
    const functionPattern = /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|class\s+\w+/g;
    const complexityPatterns = [
      { pattern: /if\s*\(/, weight: 1 },
      { pattern: /else\s+if/, weight: 1 },
      { pattern: /for\s*\(/, weight: 1 },
      { pattern: /while\s*\(/, weight: 1 },
      { pattern: /switch\s*\(/, weight: 2 },
      { pattern: /catch\s*\(/, weight: 1 },
      { pattern: /\?\s*.*\s*:/, weight: 1 }, // ternary
    ];

    functionCount = (content.match(functionPattern) || []).length;

    lines.forEach((line, index) => {
      // Check line length
      if (line.length > 120) {
        issues.push(`Line ${index + 1} is too long (${line.length} chars)`);
      }

      // Calculate complexity
      for (const { pattern, weight } of complexityPatterns) {
        if (pattern.test(line)) {
          complexity += weight;
        }
      }

      // Check for deeply nested code (rough approximation)
      const indentLevel = line.match(/^(\s*)/)?.[1].length || 0;
      if (indentLevel > 16) { // 4 levels of indentation
        complexity += 1;
        if (!issues.some(i => i.includes('deeply nested'))) {
          issues.push('Contains deeply nested code');
        }
      }
    });

    // Check for spaghetti code indicators
    if (lines.length > 500) {
      issues.push(`File is very long (${lines.length} lines)`);
      complexity += 5;
    }

    if (functionCount > 20) {
      issues.push(`Too many functions in one file (${functionCount})`);
      complexity += 3;
    }

    // Check for callback hell
    const callbackHellPattern = /}\s*\)\s*}\s*\)\s*}/;
    if (callbackHellPattern.test(content)) {
      issues.push('Possible callback hell detected');
      complexity += 5;
    }

    return {
      file: filePath.replace(this.projectPath + '/', ''),
      complexity,
      lines: lines.length,
      functions: functionCount,
      issues
    };
  }

  private async getAllFiles(dir: string = this.projectPath): Promise<string[]> {
    const files: string[] = [];
    const self = this;
    
    async function scan(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (entry.isDirectory() && !self.skipDirs.includes(entry.name)) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
        console.warn(`Cannot read directory ${currentDir}: ${error.message}`);
      }
    }

    await scan(dir);
    return files;
  }

  private async getAllCodeFiles(): Promise<string[]> {
    const files = await this.getAllFiles();
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
    return files.filter(file => codeExtensions.includes(extname(file)));
  }

  private async hasTestFiles(): Promise<boolean> {
    try {
      const files = await this.getAllFiles();
      return files.some(file => 
        file.includes('test') || 
        file.includes('spec') || 
        file.includes('__tests__') ||
        file.endsWith('.test.js') ||
        file.endsWith('.spec.js') ||
        file.endsWith('.test.ts') ||
        file.endsWith('.spec.ts')
      );
    } catch (error) {
      console.warn(`Failed to check for test files: ${error.message}`);
      return false;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private generateSecurityRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type.includes('hardcoded'))) {
      recommendations.push('Use environment variables for sensitive data');
      recommendations.push('Add .env to .gitignore and create .env.example');
    }

    if (issues.some(i => i.type === 'unsafe-eval')) {
      recommendations.push('Replace eval() with safer alternatives like JSON.parse()');
    }

    if (issues.some(i => i.type === 'unsafe-html')) {
      recommendations.push('Use textContent instead of innerHTML or sanitize input');
    }

    if (issues.some(i => i.type === 'vulnerable-dependencies')) {
      recommendations.push('Run "npm audit fix" to update vulnerable dependencies');
    }

    return recommendations;
  }

  private generateSanityRecommendations(issues: SanityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === 'missing-readme')) {
      recommendations.push('Create a README.md with project description and usage');
    }

    if (issues.some(i => i.type === 'no-tests')) {
      recommendations.push('Add unit tests to improve code reliability');
    }

    if (issues.some(i => i.type === 'large-file')) {
      recommendations.push('Consider using Git LFS for large files');
    }

    if (issues.some(i => i.type === 'missing-gitignore')) {
      recommendations.push('Add .gitignore to exclude build files and dependencies');
    }

    return recommendations;
  }

  private generateQualityRecommendations(complexFiles: CodeComplexity[]): string[] {
    const recommendations: string[] = [];
    
    if (complexFiles.some(f => f.complexity > 20)) {
      recommendations.push('Refactor complex functions into smaller, focused functions');
    }

    if (complexFiles.some(f => f.lines > 300)) {
      recommendations.push('Split large files into smaller, more manageable modules');
    }

    if (complexFiles.some(f => f.issues.some(i => i.includes('callback hell')))) {
      recommendations.push('Use async/await instead of nested callbacks');
    }

    if (complexFiles.some(f => f.functions > 15)) {
      recommendations.push('Consider splitting files with many functions into separate modules');
    }

    return recommendations;
  }

  private generateSummary(analysis: ProjectAnalysis): string {
    const { overall } = analysis;
    
    if (overall.score >= 90) {
      return 'Excellent! Your project follows best practices for sustainability and quality.';
    } else if (overall.score >= 70) {
      return 'Good project health with some areas for improvement.';
    } else if (overall.score >= 50) {
      return 'Several issues found that should be addressed for better sustainability.';
    } else {
      return 'Critical issues detected. Immediate attention required for project health.';
    }
  }
}