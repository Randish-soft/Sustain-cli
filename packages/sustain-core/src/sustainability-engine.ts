/**
 * Unified Sustainability Analysis Engine
 */

import { ProjectAnalyzer, ProjectAnalysis } from './analyzers/project_analyzer';
import { AdvancedSustainabilityAnalyzer, SustainabilityMetrics } from './analyzers/sustainability-metrics';
import { CarbonEnergyAnalyzer } from './analyzers/carbon-energy-analyzer';
import { ProjectFutureAnalyzer } from './analyzers/project-future-analyzer';
import { ComposeAnalyzer, ComposeAnalysis } from './collectors/compose_analyzer';
import { DockerResourceCollector, DockerResources } from './collectors/docker_resources';
import { simulate, SimulationResult } from './simulation/kwh';

export interface ComprehensiveSustainabilityReport {
  timestamp: Date;
  projectPath: string;
  codeAnalysis: ProjectAnalysis;
  sustainabilityMetrics: SustainabilityMetrics;
  carbonAnalysis: any;
  futureAnalysis: any;
  dockerAnalysis: DockerResources;
  composeAnalysis: ComposeAnalysis[];
  energySimulation: SimulationResult[];
  overallSustainability: {
    score: number;
    category: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    breakdown: {
      codeQuality: number;
      carbonEfficiency: number;
      energyUsage: number;
      futureProofing: number;
      infrastructure: number;
    };
  };
  criticalIssues: string[];
  optimizationOpportunities: string[];
  immediateActions: string[];
  longTermRecommendations: string[];
}

export class SustainabilityEngine {
  private projectPath: string;
  private projectAnalyzer: ProjectAnalyzer;
  private sustainabilityAnalyzer: AdvancedSustainabilityAnalyzer;
  private carbonAnalyzer: CarbonEnergyAnalyzer;
  private futureAnalyzer: ProjectFutureAnalyzer;
  private composeAnalyzer: ComposeAnalyzer;
  private dockerCollector: DockerResourceCollector;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.projectAnalyzer = new ProjectAnalyzer(this.projectPath);
    this.sustainabilityAnalyzer = new AdvancedSustainabilityAnalyzer();
    this.carbonAnalyzer = new CarbonEnergyAnalyzer();
    this.futureAnalyzer = new ProjectFutureAnalyzer();
    this.composeAnalyzer = new ComposeAnalyzer(this.projectPath);
    this.dockerCollector = new DockerResourceCollector();
  }

  async generateComprehensiveReport(): Promise<ComprehensiveSustainabilityReport> {
    console.log('🌱 Starting comprehensive sustainability analysis...\n');

    const [
      codeAnalysis,
      sustainabilityMetrics,
      carbonAnalysis,
      futureAnalysis,
      dockerAnalysis,
      composeAnalysis,
      energySimulation
    ] = await Promise.all([
      this.projectAnalyzer.analyze(),
      this.sustainabilityAnalyzer.analyzeProject(this.projectPath),
      this.carbonAnalyzer.analyzeProjectCarbon(this.projectPath),
      this.futureAnalyzer.analyzeProjectIdea(this.projectPath),
      this.dockerCollector.collect(),
      this.composeAnalyzer.analyze(),
      this.runEnergySimulation()
    ]);

    const overallSustainability = this.calculateOverallSustainability(
      codeAnalysis,
      sustainabilityMetrics,
      carbonAnalysis,
      futureAnalysis,
      composeAnalysis
    );

    const insights = this.generateActionableInsights(
      codeAnalysis,
      sustainabilityMetrics,
      carbonAnalysis,
      futureAnalysis,
      composeAnalysis,
      dockerAnalysis
    );

    return {
      timestamp: new Date(),
      projectPath: this.projectPath,
      codeAnalysis,
      sustainabilityMetrics,
      carbonAnalysis,
      futureAnalysis,
      dockerAnalysis,
      composeAnalysis,
      energySimulation,
      overallSustainability,
      ...insights
    };
  }

  async generateQuickReport(): Promise<any> {
    const [codeAnalysis, composeAnalysis, dockerAnalysis] = await Promise.all([
      this.projectAnalyzer.analyze(),
      this.composeAnalyzer.analyze(),
      this.dockerCollector.collect()
    ]);

    const quickScore = this.calculateQuickScore(codeAnalysis, composeAnalysis, dockerAnalysis);

    return {
      timestamp: new Date(),
      projectPath: this.projectPath,
      score: quickScore.overall,
      category: quickScore.category,
      criticalIssues: quickScore.issues,
      quickFixes: quickScore.fixes,
      estimatedCarbon: quickScore.estimatedCarbon
    };
  }

  private calculateOverallSustainability(
    code: ProjectAnalysis,
    sustainability: SustainabilityMetrics,
    carbon: any,
    future: any,
    compose: ComposeAnalysis[]
  ) {
    const scores = {
      codeQuality: code.overall.score * 0.2,
      carbonEfficiency: carbon.carbonScore * 0.3,
      energyUsage: sustainability.energy.energyEfficiency * 0.2,
      futureProofing: future.problemSolutionFit * 0.15,
      infrastructure: compose.reduce((acc, curr) => acc + curr.sustainabilityScore, 0) / Math.max(compose.length, 1) * 0.15
    };

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    return {
      score: Math.round(overallScore),
      category: this.getSustainabilityCategory(overallScore),
      breakdown: scores
    };
  }

  private getSustainabilityCategory(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private generateActionableInsights(
    code: ProjectAnalysis,
    sustainability: SustainabilityMetrics,
    carbon: any,
    future: any,
    compose: ComposeAnalysis[],
    docker: DockerResources
  ) {
    const criticalIssues: string[] = [];
    const optimizationOpportunities: string[] = [];
    const immediateActions: string[] = [];
    const longTermRecommendations: string[] = [];

    if (code.security.score < 70) {
      criticalIssues.push(`Security score is low (${code.security.score}/100). Address security vulnerabilities immediately.`);
    }

    if (carbon.carbonScore < 50) {
      criticalIssues.push(`Carbon footprint is very high. Project emits ${carbon.estimatedCO2PerMonth.toFixed(2)} kg CO2/month.`);
    }

    if (sustainability.energy.totalEnergyKWh > 100) {
      optimizationOpportunities.push(`High energy consumption (${sustainability.energy.totalEnergyKWh.toFixed(2)} KWh/month). Optimize resource usage.`);
    }

    if (compose.some(analysis => analysis.sustainabilityScore < 70)) {
      optimizationOpportunities.push('Docker Compose configuration can be optimized for better sustainability.');
    }

    if (docker.containers.length > 0 && docker.containers.some(c => c.cpu && parseFloat(c.cpu) > 80)) {
      immediateActions.push('Some Docker containers are using high CPU. Consider optimizing or scaling.');
    }

    if (sustainability.memory.efficiency.allocationEfficiency < 80) {
      longTermRecommendations.push('Implement memory optimization strategies for long-term scalability.');
    }

    return {
      criticalIssues,
      optimizationOpportunities,
      immediateActions,
      longTermRecommendations
    };
  }

  private calculateQuickScore(
    code: ProjectAnalysis,
    compose: ComposeAnalysis[],
    docker: DockerResources
  ) {
    const baseScore = code.overall.score * 0.6;
    const composeScore = compose.reduce((acc, curr) => acc + curr.sustainabilityScore, 0) / Math.max(compose.length, 1) * 0.3;
    const dockerScore = docker.containers.length === 0 ? 100 : 80;
    
    const overall = (baseScore + composeScore + dockerScore) / (0.6 + 0.3 + 0.1);

    const estimatedCarbon = compose.reduce((acc, curr) => {
      const size = parseFloat(curr.totalEstimatedSize);
      return acc + (size * 0.1);
    }, 0);

    return {
      overall: Math.round(overall),
      category: this.getSustainabilityCategory(overall),
      issues: [
        ...code.security.issues.slice(0, 2).map(issue => `Security: ${issue.message}`),
        ...code.codeQuality.complexFiles.slice(0, 2).map(file => `Complex: ${file.file}`)
      ],
      fixes: compose.flatMap(analysis => analysis.recommendations.slice(0, 2)),
      estimatedCarbon
    };
  }

  private async runEnergySimulation(): Promise<SimulationResult[]> {
    try {
      return [];
    } catch (error) {
      console.warn('Energy simulation failed:', error);
      return [];
    }
  }
}

export default SustainabilityEngine;