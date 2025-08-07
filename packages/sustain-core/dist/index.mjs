// src/collectors/docker_resources.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var DockerResourceCollector = class {
  async collect() {
    try {
      await execAsync("docker info");
      const { stdout: containerList } = await execAsync('docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}"');
      if (!containerList.trim()) {
        return {
          containers: [],
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const containers = [];
      const lines = containerList.trim().split("\n");
      for (const line of lines) {
        const [id, name, status] = line.split("|");
        try {
          const { stdout: stats } = await execAsync(
            `docker stats ${id} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}"`
          );
          const [cpu, memory] = stats.trim().split("|");
          containers.push({
            id,
            name,
            cpu,
            memory,
            status
          });
        } catch (error) {
          containers.push({
            id,
            name,
            status,
            cpu: "N/A",
            memory: "N/A"
          });
        }
      }
      return {
        containers,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Docker error:", error);
      return {
        containers: [],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  async getContainerDetails(containerId) {
    try {
      const { stdout: details } = await execAsync(
        `docker inspect ${containerId} --format "{{.Name}}|{{.State.Status}}"`
      );
      const [name, status] = details.trim().split("|");
      const { stdout: stats } = await execAsync(
        `docker stats ${containerId} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}"`
      );
      const [cpu, memory] = stats.trim().split("|");
      return {
        id: containerId,
        name: name.replace(/^\//, ""),
        // Remove leading slash
        cpu,
        memory,
        status
      };
    } catch (error) {
      return null;
    }
  }
};

// src/collectors/compose_analyzer.ts
import { promises as fs } from "fs";
import { join, resolve } from "path";
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";
var execAsync2 = promisify2(exec2);
function parseSimpleYaml(content) {
  const lines = content.split("\n");
  const result = { services: {} };
  let currentService = null;
  let currentIndent = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    if (trimmed === "services:") {
      currentIndent = indent;
      continue;
    }
    if (indent === currentIndent + 2 && !trimmed.includes(":")) continue;
    if (indent === currentIndent + 2 && trimmed.endsWith(":")) {
      currentService = trimmed.slice(0, -1);
      result.services[currentService] = {};
    } else if (currentService && indent === currentIndent + 4) {
      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim();
      result.services[currentService][key] = value;
    }
  }
  return result;
}
var ComposeAnalyzer = class {
  projectPath;
  // Base image size estimates (in MB)
  imageEstimates = {
    "alpine": { size: 5, memory: 4, cpu: 0.1 },
    "busybox": { size: 1, memory: 2, cpu: 0.05 },
    "ubuntu": { size: 77, memory: 64, cpu: 0.2 },
    "debian": { size: 124, memory: 64, cpu: 0.2 },
    "centos": { size: 204, memory: 128, cpu: 0.3 },
    "node": { size: 900, memory: 512, cpu: 0.5 },
    "node:alpine": { size: 110, memory: 256, cpu: 0.3 },
    "python": { size: 885, memory: 512, cpu: 0.5 },
    "python:alpine": { size: 45, memory: 128, cpu: 0.2 },
    "nginx": { size: 142, memory: 128, cpu: 0.2 },
    "nginx:alpine": { size: 23, memory: 64, cpu: 0.1 },
    "redis": { size: 117, memory: 256, cpu: 0.3 },
    "redis:alpine": { size: 32, memory: 128, cpu: 0.2 },
    "postgres": { size: 379, memory: 512, cpu: 0.5 },
    "postgres:alpine": { size: 160, memory: 256, cpu: 0.4 },
    "mysql": { size: 544, memory: 512, cpu: 0.5 },
    "mongo": { size: 493, memory: 1024, cpu: 0.6 },
    "rabbitmq": { size: 220, memory: 512, cpu: 0.4 },
    "elasticsearch": { size: 774, memory: 2048, cpu: 1 },
    "default": { size: 500, memory: 512, cpu: 0.5 }
  };
  constructor(projectPath) {
    this.projectPath = projectPath || process.cwd();
  }
  async analyze() {
    console.log(`Searching for Docker Compose files in: ${this.projectPath}`);
    const composeFiles = await this.findComposeFilesRecursive();
    const analyses = [];
    for (const composeFile of composeFiles) {
      const analysis = await this.analyzeComposeFile(composeFile);
      analyses.push(analysis);
    }
    return analyses;
  }
  async findComposeFilesRecursive(dir = this.projectPath) {
    const composeFiles = [];
    const possibleNames = [
      "docker-compose.yml",
      "docker-compose.yaml",
      "compose.yml",
      "compose.yaml",
      "docker-compose.dev.yml",
      "docker-compose.prod.yml",
      "docker-compose.override.yml"
    ];
    const skipDirs = ["node_modules", ".git", "dist", "build", ".next", "coverage", "vendor"];
    async function scanDirectory(currentDir, basePath) {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (!skipDirs.includes(entry.name)) {
              await scanDirectory(fullPath, basePath);
            }
          } else if (entry.isFile() && possibleNames.includes(entry.name)) {
            const relativePath = fullPath.substring(basePath.length + 1);
            composeFiles.push(relativePath);
            console.log(`Found docker-compose file: ${relativePath}`);
          }
        }
      } catch (error) {
      }
    }
    await scanDirectory(dir, this.projectPath);
    if (composeFiles.length === 0) {
      const projectRoot = await this.findProjectRoot();
      if (projectRoot && projectRoot !== this.projectPath) {
        this.projectPath = projectRoot;
        await scanDirectory(projectRoot, projectRoot);
      }
    }
    return composeFiles;
  }
  async findProjectRoot(startPath = this.projectPath) {
    let currentPath = resolve(startPath);
    const indicators = ["package.json", ".git", "pnpm-workspace.yaml", ".gitignore"];
    while (currentPath !== "/" && currentPath !== resolve(currentPath, "..")) {
      for (const indicator of indicators) {
        try {
          await fs.access(join(currentPath, indicator));
          console.log(`Found project root at: ${currentPath}`);
          return currentPath;
        } catch {
        }
      }
      currentPath = resolve(currentPath, "..");
    }
    return null;
  }
  async analyzeComposeFile(filename) {
    const filePath = filename.startsWith("/") ? filename : join(this.projectPath, filename);
    const content = await fs.readFile(filePath, "utf8");
    const compose = parseSimpleYaml(content);
    const services = [];
    let totalSize = 0;
    let totalMemory = 0;
    let totalCPU = 0;
    if (compose.services) {
      for (const [serviceName, serviceConfig] of Object.entries(compose.services)) {
        const service = await this.analyzeService(serviceName, serviceConfig);
        services.push(service);
        totalSize += parseFloat(service.estimatedSize);
        totalMemory += parseFloat(service.estimatedMemory);
        totalCPU += parseFloat(service.estimatedCPU);
      }
    }
    const recommendations = this.generateRecommendations(services);
    const sustainabilityScore = this.calculateSustainabilityScore(services);
    return {
      composeFile: filename,
      services,
      totalEstimatedSize: `${totalSize.toFixed(1)} MB`,
      totalEstimatedMemory: `${totalMemory.toFixed(0)} MB`,
      totalEstimatedCPU: `${totalCPU.toFixed(2)} cores`,
      sustainabilityScore,
      recommendations
    };
  }
  async analyzeService(name, config) {
    var _a, _b, _c, _d;
    let estimates = this.imageEstimates.default;
    if (config.image) {
      const imageName = config.image.split(":")[0];
      const imageTag = config.image.includes(":") ? config.image : `${config.image}:latest`;
      for (const [key, value] of Object.entries(this.imageEstimates)) {
        if (imageTag.includes(key)) {
          estimates = value;
          break;
        }
      }
      try {
        const { stdout } = await execAsync2(`docker images ${config.image} --format "{{.Size}}"`);
        if (stdout.trim()) {
          const sizeMatch = stdout.trim().match(/(\d+\.?\d*)\s*(MB|GB|KB)/i);
          if (sizeMatch) {
            let size = parseFloat(sizeMatch[1]);
            if (sizeMatch[2].toUpperCase() === "GB") size *= 1024;
            if (sizeMatch[2].toUpperCase() === "KB") size /= 1024;
            estimates = { ...estimates, size };
          }
        }
      } catch {
      }
    }
    let resourceLimits;
    if ((_b = (_a = config.deploy) == null ? void 0 : _a.resources) == null ? void 0 : _b.limits) {
      resourceLimits = {
        cpus: config.deploy.resources.limits.cpus,
        memory: config.deploy.resources.limits.memory
      };
    }
    const replicas = ((_c = config.deploy) == null ? void 0 : _c.replicas) || 1;
    const finalSize = estimates.size;
    const finalMemory = estimates.memory * replicas;
    const finalCPU = estimates.cpu * replicas;
    return {
      name,
      image: config.image,
      build: ((_d = config.build) == null ? void 0 : _d.context) || config.build,
      estimatedSize: `${finalSize} MB`,
      estimatedMemory: `${finalMemory} MB`,
      estimatedCPU: `${finalCPU}`,
      replicas,
      resourceLimits
    };
  }
  generateRecommendations(services) {
    const recommendations = [];
    for (const service of services) {
      if (service.image && !service.image.includes("alpine") && !service.image.includes("slim")) {
        const hasAlpineVariant = ["node", "python", "nginx", "redis", "postgres"].some(
          (img) => {
            var _a;
            return (_a = service.image) == null ? void 0 : _a.includes(img);
          }
        );
        if (hasAlpineVariant) {
          recommendations.push(
            `Consider using Alpine variant for ${service.name} to reduce size by ~80%`
          );
        }
      }
      if (!service.resourceLimits) {
        recommendations.push(
          `Set resource limits for ${service.name} to prevent overconsumption`
        );
      }
      const memory = parseFloat(service.estimatedMemory);
      if (memory > 1024) {
        recommendations.push(
          `Service ${service.name} uses high memory (${service.estimatedMemory}). Consider optimization.`
        );
      }
    }
    if (services.length > 5) {
      recommendations.push(
        "Consider consolidating services where possible to reduce overhead"
      );
    }
    return recommendations;
  }
  calculateSustainabilityScore(services) {
    var _a, _b;
    let score = 100;
    for (const service of services) {
      const size = parseFloat(service.estimatedSize);
      if (size > 500) score -= 5;
      if (size > 1e3) score -= 10;
      if (((_a = service.image) == null ? void 0 : _a.includes("alpine")) || ((_b = service.image) == null ? void 0 : _b.includes("slim"))) {
        score += 5;
      }
      if (service.resourceLimits) {
        score += 3;
      }
      const memory = parseFloat(service.estimatedMemory);
      if (memory > 2048) score -= 10;
    }
    return Math.max(0, Math.min(100, score));
  }
};

// src/analyzers/project_analyzer.ts
import { promises as fs2 } from "fs";
import { join as join2, extname } from "path";
import { execSync } from "child_process";
var ProjectAnalyzer = class {
  projectPath;
  skipDirs = ["node_modules", ".git", "dist", "build", "coverage", ".next", "vendor"];
  maxFileSize = 10 * 1024 * 1024;
  // 10MB max file size
  timeout = 3e4;
  // 30 second timeout
  constructor(projectPath) {
    this.projectPath = projectPath || process.cwd();
  }
  async analyze(options) {
    const runAll = !options || !options.security && !options.sanity && !options.quality;
    const analysis = {
      projectPath: this.projectPath,
      security: { score: 100, issues: [], recommendations: [] },
      sanity: { score: 100, issues: [], recommendations: [] },
      codeQuality: { score: 100, complexFiles: [], recommendations: [] },
      overall: { score: 100, summary: "" }
    };
    if (!await this.validateProjectPath()) {
      throw new Error(`Invalid project path: ${this.projectPath}`);
    }
    const analysisPromises = [];
    if (runAll || (options == null ? void 0 : options.security)) {
      analysisPromises.push(this.runSecurityAnalysis(analysis));
    }
    if (runAll || (options == null ? void 0 : options.sanity)) {
      analysisPromises.push(this.runSanityAnalysis(analysis));
    }
    if (runAll || (options == null ? void 0 : options.quality)) {
      analysisPromises.push(this.runQualityAnalysis(analysis));
    }
    await Promise.allSettled(analysisPromises);
    this.calculateOverallScore(analysis);
    return analysis;
  }
  async validateProjectPath() {
    try {
      const stats = await fs2.stat(this.projectPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }
  async runSecurityAnalysis(analysis) {
    const startTime = Date.now();
    try {
      analysis.security = await this.analyzeSecurityAsync();
      analysis.security.analysisTime = Date.now() - startTime;
    } catch (error) {
      console.warn(`Security analysis failed: ${error.message}`);
      analysis.security = {
        score: 50,
        issues: [],
        recommendations: ["Manual security review needed due to analysis failure"],
        analysisTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
  async runSanityAnalysis(analysis) {
    const startTime = Date.now();
    try {
      analysis.sanity = await this.analyzeSanity();
      analysis.sanity.analysisTime = Date.now() - startTime;
    } catch (error) {
      console.warn(`Sanity analysis failed: ${error.message}`);
      analysis.sanity = {
        score: 50,
        issues: [],
        recommendations: ["Manual project structure review needed due to analysis failure"],
        analysisTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
  async runQualityAnalysis(analysis) {
    const startTime = Date.now();
    try {
      analysis.codeQuality = await this.analyzeCodeQuality();
      analysis.codeQuality.analysisTime = Date.now() - startTime;
    } catch (error) {
      console.warn(`Code quality analysis failed: ${error.message}`);
      analysis.codeQuality = {
        score: 50,
        complexFiles: [],
        recommendations: ["Manual code review needed due to analysis failure"],
        analysisTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
  calculateOverallScore(analysis) {
    const validScores = [];
    if (!analysis.security.error) validScores.push(analysis.security.score);
    if (!analysis.sanity.error) validScores.push(analysis.sanity.score);
    if (!analysis.codeQuality.error) validScores.push(analysis.codeQuality.score);
    if (validScores.length === 0) {
      analysis.overall.score = 0;
      analysis.overall.summary = "Analysis failed - manual review required";
      return;
    }
    analysis.overall.score = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
    analysis.overall.summary = this.generateSummary(analysis);
  }
  async analyzeSecurityAsync() {
    const issues = [];
    try {
      const files = await this.getAllFiles();
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map((file) => this.analyzeFileForSecurity(file, issues)));
      }
      await this.checkVulnerableDependencies(issues);
    } catch (error) {
      throw new Error(`Security analysis failed: ${error.message}`);
    }
    const score = Math.max(0, 100 - issues.filter((i) => i.severity === "high").length * 20 - issues.filter((i) => i.severity === "medium").length * 10);
    const recommendations = this.generateSecurityRecommendations(issues);
    return { score, issues, recommendations };
  }
  async analyzeFileForSecurity(file, issues) {
    try {
      const stats = await fs2.stat(file);
      if (stats.size > this.maxFileSize) {
        console.warn(`Skipping large file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }
      const content = await fs2.readFile(file, "utf8");
      const secretPatterns = [
        { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, type: "hardcoded-api-key" },
        { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, type: "hardcoded-password" },
        { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, type: "hardcoded-secret" },
        { pattern: /token\s*[:=]\s*["'][^"']+["']/gi, type: "hardcoded-token" },
        { pattern: /aws_access_key_id/gi, type: "aws-credentials" },
        { pattern: /private[_-]?key/gi, type: "private-key" }
      ];
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        for (const { pattern, type } of secretPatterns) {
          if (pattern.test(line) && !line.includes("process.env") && !line.includes("example")) {
            issues.push({
              type,
              severity: "high",
              file: file.replace(this.projectPath + "/", ""),
              line: index + 1,
              message: `Potential ${type.replace("-", " ")} found`
            });
          }
        }
      });
      if (file.endsWith(".js") || file.endsWith(".ts")) {
        this.checkUnsafePractices(file, content, issues);
      }
    } catch (error) {
      console.warn(`Failed to analyze file ${file}: ${error.message}`);
    }
  }
  checkUnsafePractices(file, content, issues) {
    if (content.includes("eval(")) {
      issues.push({
        type: "unsafe-eval",
        severity: "high",
        file: file.replace(this.projectPath + "/", ""),
        message: "Use of eval() is a security risk"
      });
    }
    if (content.includes("innerHTML")) {
      issues.push({
        type: "unsafe-html",
        severity: "medium",
        file: file.replace(this.projectPath + "/", ""),
        message: "innerHTML can lead to XSS vulnerabilities"
      });
    }
    if (content.match(/require\s*\([`'"]\s*\$\{/)) {
      issues.push({
        type: "dynamic-require",
        severity: "medium",
        file: file.replace(this.projectPath + "/", ""),
        message: "Dynamic require() can be a security risk"
      });
    }
  }
  async checkVulnerableDependencies(issues) {
    var _a;
    const packageJsonPath = join2(this.projectPath, "package.json");
    if (!await this.fileExists(packageJsonPath)) {
      return;
    }
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("npm audit timeout")), this.timeout);
      });
      const auditPromise = new Promise((resolve2) => {
        var _a2;
        try {
          execSync("npm audit --json", { cwd: this.projectPath, stdio: "pipe" });
          resolve2(null);
        } catch (e) {
          const output2 = ((_a2 = e.stdout) == null ? void 0 : _a2.toString()) || "";
          resolve2(output2);
        }
      });
      const output = await Promise.race([auditPromise, timeoutPromise]);
      if (output) {
        try {
          const audit = JSON.parse(output);
          if ((_a = audit.metadata) == null ? void 0 : _a.vulnerabilities) {
            const vulns = audit.metadata.vulnerabilities;
            if (vulns.high > 0) {
              issues.push({
                type: "vulnerable-dependencies",
                severity: "high",
                file: "package.json",
                message: `${vulns.high} high severity vulnerabilities in dependencies`
              });
            }
            if (vulns.moderate > 0) {
              issues.push({
                type: "vulnerable-dependencies",
                severity: "medium",
                file: "package.json",
                message: `${vulns.moderate} moderate severity vulnerabilities in dependencies`
              });
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse npm audit output");
        }
      }
    } catch (error) {
      console.warn(`npm audit failed: ${error.message}`);
    }
  }
  async analyzeSanity() {
    const issues = [];
    try {
      if (!await this.fileExists(join2(this.projectPath, "README.md"))) {
        issues.push({
          type: "missing-readme",
          file: "README.md",
          message: "No README.md file found"
        });
      }
      if (!await this.fileExists(join2(this.projectPath, ".gitignore"))) {
        issues.push({
          type: "missing-gitignore",
          file: ".gitignore",
          message: "No .gitignore file found"
        });
      }
      await this.checkPackageJson(issues);
      const hasTests = await this.hasTestFiles();
      if (!hasTests) {
        issues.push({
          type: "no-tests",
          file: "project",
          message: "No test files found in the project"
        });
      }
      if (await this.fileExists(join2(this.projectPath, ".env"))) {
        if (!await this.fileExists(join2(this.projectPath, ".env.example"))) {
          issues.push({
            type: "missing-env-example",
            file: ".env.example",
            message: "Found .env but no .env.example file"
          });
        }
      }
      await this.checkLargeFiles(issues);
    } catch (error) {
      throw new Error(`Sanity analysis failed: ${error.message}`);
    }
    const score = Math.max(0, 100 - issues.length * 10);
    const recommendations = this.generateSanityRecommendations(issues);
    return { score, issues, recommendations };
  }
  async checkPackageJson(issues) {
    const packageJsonPath = join2(this.projectPath, "package.json");
    if (!await this.fileExists(packageJsonPath)) {
      return;
    }
    try {
      const packageJson = JSON.parse(await fs2.readFile(packageJsonPath, "utf8"));
      if (!packageJson.name) {
        issues.push({
          type: "package-json-incomplete",
          file: "package.json",
          message: 'Missing "name" field in package.json'
        });
      }
      if (!packageJson.version) {
        issues.push({
          type: "package-json-incomplete",
          file: "package.json",
          message: 'Missing "version" field in package.json'
        });
      }
      if (!packageJson.description) {
        issues.push({
          type: "package-json-incomplete",
          file: "package.json",
          message: 'Missing "description" field in package.json'
        });
      }
      if (!packageJson.scripts || Object.keys(packageJson.scripts).length === 0) {
        issues.push({
          type: "no-scripts",
          file: "package.json",
          message: "No scripts defined in package.json"
        });
      }
    } catch (error) {
      issues.push({
        type: "invalid-package-json",
        file: "package.json",
        message: "Invalid or corrupted package.json file"
      });
    }
  }
  async checkLargeFiles(issues) {
    try {
      const files = await this.getAllFiles();
      for (const file of files) {
        try {
          const stats = await fs2.stat(file);
          if (stats.size > 1024 * 1024 * 10) {
            issues.push({
              type: "large-file",
              file: file.replace(this.projectPath + "/", ""),
              message: `File is very large (${(stats.size / 1024 / 1024).toFixed(2)}MB)`
            });
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.warn(`Failed to check file sizes: ${error.message}`);
    }
  }
  async analyzeCodeQuality() {
    const complexFiles = [];
    try {
      const files = await this.getAllCodeFiles();
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((file) => this.analyzeFileComplexitySafe(file))
        );
        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            const analysis = result.value;
            if (analysis.complexity > 10 || analysis.issues.length > 0) {
              complexFiles.push(analysis);
            }
          } else if (result.status === "rejected") {
            console.warn(`Failed to analyze ${batch[index]}: ${result.reason}`);
          }
        });
      }
      complexFiles.sort((a, b) => b.complexity - a.complexity);
    } catch (error) {
      throw new Error(`Code quality analysis failed: ${error.message}`);
    }
    let score = 100;
    complexFiles.forEach((file) => {
      if (file.complexity > 20) score -= 10;
      else if (file.complexity > 15) score -= 5;
      else if (file.complexity > 10) score -= 2;
    });
    const recommendations = this.generateQualityRecommendations(complexFiles);
    return {
      score: Math.max(0, score),
      complexFiles: complexFiles.slice(0, 10),
      // Top 10 most complex
      recommendations
    };
  }
  async analyzeFileComplexitySafe(filePath) {
    try {
      const stats = await fs2.stat(filePath);
      if (stats.size > this.maxFileSize) {
        console.warn(`Skipping large file for complexity analysis: ${filePath}`);
        return null;
      }
      const content = await fs2.readFile(filePath, "utf8");
      return this.analyzeFileComplexity(filePath, content);
    } catch (error) {
      throw new Error(`Failed to analyze file complexity for ${filePath}: ${error.message}`);
    }
  }
  analyzeFileComplexity(filePath, content) {
    const lines = content.split("\n");
    const issues = [];
    let complexity = 0;
    let functionCount = 0;
    const functionPattern = /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|class\s+\w+/g;
    const complexityPatterns = [
      { pattern: /if\s*\(/, weight: 1 },
      { pattern: /else\s+if/, weight: 1 },
      { pattern: /for\s*\(/, weight: 1 },
      { pattern: /while\s*\(/, weight: 1 },
      { pattern: /switch\s*\(/, weight: 2 },
      { pattern: /catch\s*\(/, weight: 1 },
      { pattern: /\?\s*.*\s*:/, weight: 1 }
      // ternary
    ];
    functionCount = (content.match(functionPattern) || []).length;
    lines.forEach((line, index) => {
      var _a;
      if (line.length > 120) {
        issues.push(`Line ${index + 1} is too long (${line.length} chars)`);
      }
      for (const { pattern, weight } of complexityPatterns) {
        if (pattern.test(line)) {
          complexity += weight;
        }
      }
      const indentLevel = ((_a = line.match(/^(\s*)/)) == null ? void 0 : _a[1].length) || 0;
      if (indentLevel > 16) {
        complexity += 1;
        if (!issues.some((i) => i.includes("deeply nested"))) {
          issues.push("Contains deeply nested code");
        }
      }
    });
    if (lines.length > 500) {
      issues.push(`File is very long (${lines.length} lines)`);
      complexity += 5;
    }
    if (functionCount > 20) {
      issues.push(`Too many functions in one file (${functionCount})`);
      complexity += 3;
    }
    const callbackHellPattern = /}\s*\)\s*}\s*\)\s*}/;
    if (callbackHellPattern.test(content)) {
      issues.push("Possible callback hell detected");
      complexity += 5;
    }
    return {
      file: filePath.replace(this.projectPath + "/", ""),
      complexity,
      lines: lines.length,
      functions: functionCount,
      issues
    };
  }
  async getAllFiles(dir = this.projectPath) {
    const files = [];
    const self = this;
    async function scan(currentDir) {
      try {
        const entries = await fs2.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join2(currentDir, entry.name);
          if (entry.isDirectory() && !self.skipDirs.includes(entry.name)) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${currentDir}: ${error.message}`);
      }
    }
    await scan(dir);
    return files;
  }
  async getAllCodeFiles() {
    const files = await this.getAllFiles();
    const codeExtensions = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"];
    return files.filter((file) => codeExtensions.includes(extname(file)));
  }
  async hasTestFiles() {
    try {
      const files = await this.getAllFiles();
      return files.some(
        (file) => file.includes("test") || file.includes("spec") || file.includes("__tests__") || file.endsWith(".test.js") || file.endsWith(".spec.js") || file.endsWith(".test.ts") || file.endsWith(".spec.ts")
      );
    } catch (error) {
      console.warn(`Failed to check for test files: ${error.message}`);
      return false;
    }
  }
  async fileExists(path) {
    try {
      await fs2.access(path);
      return true;
    } catch {
      return false;
    }
  }
  generateSecurityRecommendations(issues) {
    const recommendations = [];
    if (issues.some((i) => i.type.includes("hardcoded"))) {
      recommendations.push("Use environment variables for sensitive data");
      recommendations.push("Add .env to .gitignore and create .env.example");
    }
    if (issues.some((i) => i.type === "unsafe-eval")) {
      recommendations.push("Replace eval() with safer alternatives like JSON.parse()");
    }
    if (issues.some((i) => i.type === "unsafe-html")) {
      recommendations.push("Use textContent instead of innerHTML or sanitize input");
    }
    if (issues.some((i) => i.type === "vulnerable-dependencies")) {
      recommendations.push('Run "npm audit fix" to update vulnerable dependencies');
    }
    return recommendations;
  }
  generateSanityRecommendations(issues) {
    const recommendations = [];
    if (issues.some((i) => i.type === "missing-readme")) {
      recommendations.push("Create a README.md with project description and usage");
    }
    if (issues.some((i) => i.type === "no-tests")) {
      recommendations.push("Add unit tests to improve code reliability");
    }
    if (issues.some((i) => i.type === "large-file")) {
      recommendations.push("Consider using Git LFS for large files");
    }
    if (issues.some((i) => i.type === "missing-gitignore")) {
      recommendations.push("Add .gitignore to exclude build files and dependencies");
    }
    return recommendations;
  }
  generateQualityRecommendations(complexFiles) {
    const recommendations = [];
    if (complexFiles.some((f) => f.complexity > 20)) {
      recommendations.push("Refactor complex functions into smaller, focused functions");
    }
    if (complexFiles.some((f) => f.lines > 300)) {
      recommendations.push("Split large files into smaller, more manageable modules");
    }
    if (complexFiles.some((f) => f.issues.some((i) => i.includes("callback hell")))) {
      recommendations.push("Use async/await instead of nested callbacks");
    }
    if (complexFiles.some((f) => f.functions > 15)) {
      recommendations.push("Consider splitting files with many functions into separate modules");
    }
    return recommendations;
  }
  generateSummary(analysis) {
    const { overall } = analysis;
    if (overall.score >= 90) {
      return "Excellent! Your project follows best practices for sustainability and quality.";
    } else if (overall.score >= 70) {
      return "Good project health with some areas for improvement.";
    } else if (overall.score >= 50) {
      return "Several issues found that should be addressed for better sustainability.";
    } else {
      return "Critical issues detected. Immediate attention required for project health.";
    }
  }
};

// src/index.ts
function placeholder() {
  return "Hello, Sustain";
}
export {
  ComposeAnalyzer,
  DockerResourceCollector,
  ProjectAnalyzer,
  placeholder
};
//# sourceMappingURL=index.mjs.map