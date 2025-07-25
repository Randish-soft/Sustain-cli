import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple YAML parser for docker-compose files
function parseSimpleYaml(content: string): any {
  // This is a very basic YAML parser for docker-compose files
  // In production, you'd want to use js-yaml
  const lines = content.split('\n');
  const result: any = { services: {} };
  let currentService: string | null = null;
  let currentIndent = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    
    if (trimmed === 'services:') {
      currentIndent = indent;
      continue;
    }
    
    if (indent === currentIndent + 2 && !trimmed.includes(':')) continue;
    
    if (indent === currentIndent + 2 && trimmed.endsWith(':')) {
      currentService = trimmed.slice(0, -1);
      result.services[currentService] = {};
    } else if (currentService && indent === currentIndent + 4) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      result.services[currentService][key] = value;
    }
  }
  
  return result;
}

export interface ComposeService {
  name: string;
  image?: string;
  build?: string;
  estimatedSize: string;
  estimatedMemory: string;
  estimatedCPU: string;
  replicas: number;
  resourceLimits?: {
    cpus?: string;
    memory?: string;
  };
}

export interface ComposeAnalysis {
  composeFile: string;
  services: ComposeService[];
  totalEstimatedSize: string;
  totalEstimatedMemory: string;
  totalEstimatedCPU: string;
  sustainabilityScore: number;
  recommendations: string[];
}

export class ComposeAnalyzer {
  private projectPath: string;
  
  // Base image size estimates (in MB)
  private readonly imageEstimates: Record<string, { size: number; memory: number; cpu: number }> = {
    'alpine': { size: 5, memory: 4, cpu: 0.1 },
    'busybox': { size: 1, memory: 2, cpu: 0.05 },
    'ubuntu': { size: 77, memory: 64, cpu: 0.2 },
    'debian': { size: 124, memory: 64, cpu: 0.2 },
    'centos': { size: 204, memory: 128, cpu: 0.3 },
    'node': { size: 900, memory: 512, cpu: 0.5 },
    'node:alpine': { size: 110, memory: 256, cpu: 0.3 },
    'python': { size: 885, memory: 512, cpu: 0.5 },
    'python:alpine': { size: 45, memory: 128, cpu: 0.2 },
    'nginx': { size: 142, memory: 128, cpu: 0.2 },
    'nginx:alpine': { size: 23, memory: 64, cpu: 0.1 },
    'redis': { size: 117, memory: 256, cpu: 0.3 },
    'redis:alpine': { size: 32, memory: 128, cpu: 0.2 },
    'postgres': { size: 379, memory: 512, cpu: 0.5 },
    'postgres:alpine': { size: 160, memory: 256, cpu: 0.4 },
    'mysql': { size: 544, memory: 512, cpu: 0.5 },
    'mongo': { size: 493, memory: 1024, cpu: 0.6 },
    'rabbitmq': { size: 220, memory: 512, cpu: 0.4 },
    'elasticsearch': { size: 774, memory: 2048, cpu: 1.0 },
    'default': { size: 500, memory: 512, cpu: 0.5 }
  };

  constructor(projectPath?: string) {
    // Use current working directory if no path provided
    this.projectPath = projectPath || process.cwd();
  }

  async analyze(): Promise<ComposeAnalysis[]> {
    console.log(`Searching for Docker Compose files in: ${this.projectPath}`);
    const composeFiles = await this.findComposeFilesRecursive();
    const analyses: ComposeAnalysis[] = [];

    for (const composeFile of composeFiles) {
      const analysis = await this.analyzeComposeFile(composeFile);
      analyses.push(analysis);
    }

    return analyses;
  }

  private async findComposeFilesRecursive(dir: string = this.projectPath): Promise<string[]> {
    const composeFiles: string[] = [];
    const possibleNames = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml',
      'docker-compose.dev.yml',
      'docker-compose.prod.yml',
      'docker-compose.override.yml'
    ];

    // Directories to skip
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'vendor'];

    async function scanDirectory(currentDir: string, basePath: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip certain directories
            if (!skipDirs.includes(entry.name)) {
              await scanDirectory(fullPath, basePath);
            }
          } else if (entry.isFile() && possibleNames.includes(entry.name)) {
            // Store relative path from project root
            const relativePath = fullPath.substring(basePath.length + 1);
            composeFiles.push(relativePath);
            console.log(`Found docker-compose file: ${relativePath}`);
          }
        }
      } catch (error) {
        // Ignore permission errors and continue
      }
    }

    await scanDirectory(dir, this.projectPath);
    
    // Also check if we're in a subdirectory and should scan upwards
    if (composeFiles.length === 0) {
      // Try to find project root (look for package.json, .git, etc.)
      const projectRoot = await this.findProjectRoot();
      if (projectRoot && projectRoot !== this.projectPath) {
        this.projectPath = projectRoot;
        await scanDirectory(projectRoot, projectRoot);
      }
    }

    return composeFiles;
  }

  private async findProjectRoot(startPath: string = this.projectPath): Promise<string | null> {
    let currentPath = resolve(startPath);
    const indicators = ['package.json', '.git', 'pnpm-workspace.yaml', '.gitignore'];
    
    // Keep going up until we find a project root indicator
    while (currentPath !== '/' && currentPath !== resolve(currentPath, '..')) {
      for (const indicator of indicators) {
        try {
          await fs.access(join(currentPath, indicator));
          console.log(`Found project root at: ${currentPath}`);
          return currentPath;
        } catch {}
      }
      
      // Move up one directory
      currentPath = resolve(currentPath, '..');
    }
    
    return null;
  }

  private async analyzeComposeFile(filename: string): Promise<ComposeAnalysis> {
    const filePath = filename.startsWith('/') ? filename : join(this.projectPath, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Use simple parser for now
    // In production, you would import js-yaml at the top of the file
    const compose = parseSimpleYaml(content);

    const services: ComposeService[] = [];
    let totalSize = 0;
    let totalMemory = 0;
    let totalCPU = 0;

    if (compose.services) {
      for (const [serviceName, serviceConfig] of Object.entries(compose.services)) {
        const service = await this.analyzeService(serviceName, serviceConfig as any);
        services.push(service);
        
        // Parse sizes to calculate totals
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

  private async analyzeService(name: string, config: any): Promise<ComposeService> {
    let estimates = this.imageEstimates.default;
    
    if (config.image) {
      // Try to match image with our estimates
      const imageName = config.image.split(':')[0];
      const imageTag = config.image.includes(':') ? config.image : `${config.image}:latest`;
      
      // Find best match
      for (const [key, value] of Object.entries(this.imageEstimates)) {
        if (imageTag.includes(key)) {
          estimates = value;
          break;
        }
      }

      // Check if we can get actual image size from Docker
      try {
        const { stdout } = await execAsync(`docker images ${config.image} --format "{{.Size}}"`);
        if (stdout.trim()) {
          // Parse Docker size (e.g., "142MB" -> 142)
          const sizeMatch = stdout.trim().match(/(\d+\.?\d*)\s*(MB|GB|KB)/i);
          if (sizeMatch) {
            let size = parseFloat(sizeMatch[1]);
            if (sizeMatch[2].toUpperCase() === 'GB') size *= 1024;
            if (sizeMatch[2].toUpperCase() === 'KB') size /= 1024;
            estimates = { ...estimates, size };
          }
        }
      } catch {
        // Image not pulled locally, use estimate
      }
    }

    // Check for resource limits in deploy section
    let resourceLimits;
    if (config.deploy?.resources?.limits) {
      resourceLimits = {
        cpus: config.deploy.resources.limits.cpus,
        memory: config.deploy.resources.limits.memory
      };
    }

    // Calculate replicas
    const replicas = config.deploy?.replicas || 1;

    // Apply replica multiplier
    const finalSize = estimates.size; // Size doesn't multiply with replicas
    const finalMemory = estimates.memory * replicas;
    const finalCPU = estimates.cpu * replicas;

    return {
      name,
      image: config.image,
      build: config.build?.context || config.build,
      estimatedSize: `${finalSize} MB`,
      estimatedMemory: `${finalMemory} MB`,
      estimatedCPU: `${finalCPU}`,
      replicas,
      resourceLimits
    };
  }

  private generateRecommendations(services: ComposeService[]): string[] {
    const recommendations: string[] = [];

    for (const service of services) {
      // Check for Alpine variants
      if (service.image && !service.image.includes('alpine') && !service.image.includes('slim')) {
        const hasAlpineVariant = ['node', 'python', 'nginx', 'redis', 'postgres'].some(
          img => service.image?.includes(img)
        );
        if (hasAlpineVariant) {
          recommendations.push(
            `Consider using Alpine variant for ${service.name} to reduce size by ~80%`
          );
        }
      }

      // Check for missing resource limits
      if (!service.resourceLimits) {
        recommendations.push(
          `Set resource limits for ${service.name} to prevent overconsumption`
        );
      }

      // Check for high memory services
      const memory = parseFloat(service.estimatedMemory);
      if (memory > 1024) {
        recommendations.push(
          `Service ${service.name} uses high memory (${service.estimatedMemory}). Consider optimization.`
        );
      }
    }

    // General recommendations
    if (services.length > 5) {
      recommendations.push(
        'Consider consolidating services where possible to reduce overhead'
      );
    }

    return recommendations;
  }

  private calculateSustainabilityScore(services: ComposeService[]): number {
    let score = 100;

    for (const service of services) {
      // Penalize large images
      const size = parseFloat(service.estimatedSize);
      if (size > 500) score -= 5;
      if (size > 1000) score -= 10;

      // Reward Alpine/slim variants
      if (service.image?.includes('alpine') || service.image?.includes('slim')) {
        score += 5;
      }

      // Reward resource limits
      if (service.resourceLimits) {
        score += 3;
      }

      // Penalize high memory usage
      const memory = parseFloat(service.estimatedMemory);
      if (memory > 2048) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }
}