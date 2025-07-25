var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ComposeAnalyzer: () => ComposeAnalyzer,
  DockerResourceCollector: () => DockerResourceCollector,
  placeholder: () => placeholder
});
module.exports = __toCommonJS(index_exports);

// src/collectors/docker_resources.ts
var import_child_process = require("child_process");
var import_util = require("util");
var execAsync = (0, import_util.promisify)(import_child_process.exec);
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
var import_fs = require("fs");
var import_path = require("path");
var import_child_process2 = require("child_process");
var import_util2 = require("util");
var execAsync2 = (0, import_util2.promisify)(import_child_process2.exec);
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
        const entries = await import_fs.promises.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = (0, import_path.join)(currentDir, entry.name);
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
    let currentPath = (0, import_path.resolve)(startPath);
    const indicators = ["package.json", ".git", "pnpm-workspace.yaml", ".gitignore"];
    while (currentPath !== "/" && currentPath !== (0, import_path.resolve)(currentPath, "..")) {
      for (const indicator of indicators) {
        try {
          await import_fs.promises.access((0, import_path.join)(currentPath, indicator));
          console.log(`Found project root at: ${currentPath}`);
          return currentPath;
        } catch {
        }
      }
      currentPath = (0, import_path.resolve)(currentPath, "..");
    }
    return null;
  }
  async analyzeComposeFile(filename) {
    const filePath = filename.startsWith("/") ? filename : (0, import_path.join)(this.projectPath, filename);
    const content = await import_fs.promises.readFile(filePath, "utf8");
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

// src/index.ts
function placeholder() {
  return "Hello, Sustain";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ComposeAnalyzer,
  DockerResourceCollector,
  placeholder
});
//# sourceMappingURL=index.js.map