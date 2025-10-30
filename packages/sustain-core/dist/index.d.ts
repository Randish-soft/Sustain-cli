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
interface ProjectAnalysis {
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
declare class ProjectAnalyzer {
    private projectPath;
    private skipDirs;
    private maxFileSize;
    private timeout;
    constructor(projectPath?: string);
    analyze(options?: {
        security?: boolean;
        sanity?: boolean;
        quality?: boolean;
    }): Promise<ProjectAnalysis>;
    private validateProjectPath;
    private runSecurityAnalysis;
    private runSanityAnalysis;
    private runQualityAnalysis;
    private calculateOverallScore;
    private analyzeSecurityAsync;
    private analyzeFileForSecurity;
    private checkUnsafePractices;
    private checkVulnerableDependencies;
    private analyzeSanity;
    private checkPackageJson;
    private checkLargeFiles;
    private analyzeCodeQuality;
    private analyzeFileComplexitySafe;
    private analyzeFileComplexity;
    private getAllFiles;
    private getAllCodeFiles;
    private hasTestFiles;
    private fileExists;
    private generateSecurityRecommendations;
    private generateSanityRecommendations;
    private generateQualityRecommendations;
    private generateSummary;
}

/**
 * Sustainability Metrics Core System
 */
interface SustainabilityMetrics {
    carbon: CarbonMetrics;
    energy: EnergyMetrics;
    memory: MemoryMetrics;
    projectIdea: ProjectIdeaAssessment;
    futureProofing: FutureProofingScore;
    overall: SustainabilityScore;
}
interface CarbonMetrics {
    estimatedCO2PerMonth: number;
    carbonIntensity: number;
    carbonScore: number;
    breakdown: {
        computation: number;
        storage: number;
        network: number;
        embodied: number;
    };
    regionalImpact: {
        region: string;
        carbonIntensity: number;
        dataCenterEfficiency: number;
        renewablePercentage: number;
    }[];
}
interface EnergyMetrics {
    totalEnergyKWh: number;
    energyPerUser: number;
    energyEfficiency: number;
    energySources: {
        renewable: number;
        fossil: number;
        nuclear: number;
        unknown: number;
    };
    patterns: {
        peakUsage: number;
        averageUsage: number;
        idleConsumption: number;
        seasonalVariation: number;
    };
}
interface MemoryMetrics {
    peakMemoryMB: number;
    averageMemoryMB: number;
    memoryLeaks: number;
    efficiency: {
        allocationEfficiency: number;
        garbageCollection: number;
        cacheHitRate: number;
        memoryReuse: number;
    };
}
interface ProjectIdeaAssessment {
    problemSolutionFit: number;
    environmentalImpact: number;
    scalabilityPotential: number;
    sdgAlignment: {
        goals: number[];
        contribution: number;
        verified: boolean;
    }[];
    innovation: {
        technicalInnovation: number;
        businessModelInnovation: number;
        socialInnovation: number;
        environmentalInnovation: number;
    };
    impact: {
        targetUsers: number;
        carbonReductionPotential: number;
        resourceOptimization: number;
    };
}
interface FutureProofingScore {
    technology: {
        stackLongevity: number;
        communitySupport: number;
        securityFuture: number;
        compatibility: number;
    };
    architecture: {
        modularity: number;
        scalability: number;
        maintainability: number;
        quantumReady: boolean;
        aiReady: boolean;
    };
    compliance: {
        carbonNeutral: boolean;
        euTaxonomy: boolean;
        esgCompliant: boolean;
        climatePledge: boolean;
    };
}
interface SustainabilityScore {
    overall: number;
    breakdown: {
        carbon: number;
        energy: number;
        memory: number;
        idea: number;
        future: number;
        documentation: number;
    };
    category: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
    verification: {
        timestamp: Date;
        version: string;
    };
}
declare class AdvancedSustainabilityAnalyzer {
    constructor();
    analyzeProject(projectPath: string): Promise<SustainabilityMetrics>;
    private comprehensiveAnalysis;
    private analyzeCarbonFootprint;
    private analyzeEnergyConsumption;
    private analyzeMemoryPatterns;
    private analyzeProjectIdea;
    private analyzeFutureProofing;
    private compileMetrics;
    private calculateOverallScore;
    private getSustainabilityCategory;
    private generateRecommendations;
}

/**
 * Carbon & Energy Analysis Engine
 */

declare class CarbonEnergyAnalyzer {
    constructor();
    analyzeProjectCarbon(projectPath: string): Promise<CarbonMetrics>;
    analyzeProjectEnergy(projectPath: string): Promise<EnergyMetrics>;
    generateCarbonReport(projectPath: string): Promise<any>;
    private suggestCarbonReductions;
}

/**
 * Project Future Analysis & Idea Assessment
 */

declare class ProjectFutureAnalyzer {
    constructor();
    analyzeProjectIdea(projectPath: string): Promise<ProjectIdeaAssessment>;
    analyzeFutureProofing(projectPath: string): Promise<FutureProofingScore>;
    analyzeDocumentationEcosystem(projectPath: string): Promise<any>;
    generateProjectSustainabilityReport(projectPath: string): Promise<any>;
    private calculateOverallSustainability;
    private generateStrategicRecommendations;
    private generateSustainabilityRoadmap;
}

interface DockerContainer {
    id: string;
    name: string;
    cpu?: string;
    memory?: string;
    status: string;
}
interface DockerResources {
    containers: DockerContainer[];
    timestamp: string;
}
declare class DockerResourceCollector {
    collect(): Promise<DockerResources>;
    getContainerDetails(containerId: string): Promise<DockerContainer | null>;
}

interface ComposeService {
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
interface ComposeAnalysis {
    composeFile: string;
    services: ComposeService[];
    totalEstimatedSize: string;
    totalEstimatedMemory: string;
    totalEstimatedCPU: string;
    sustainabilityScore: number;
    recommendations: string[];
}
declare class ComposeAnalyzer {
    private projectPath;
    private readonly imageEstimates;
    constructor(projectPath?: string);
    analyze(): Promise<ComposeAnalysis[]>;
    private findComposeFilesRecursive;
    private findProjectRoot;
    private analyzeComposeFile;
    private analyzeService;
    private generateRecommendations;
    private calculateSustainabilityScore;
}

type ScopeKind = 'website' | 'ai' | 'gaming' | 'custom';
interface BaseScope {
    kind: ScopeKind;
    name: string;
}
interface WebsiteScope extends BaseScope {
    kind: 'website';
    serverWattage: number;
    hoursOnline: number;
    pageViews: number;
    osShare?: {
        windows?: number;
        macos?: number;
        linux?: number;
    };
}
interface AIScope extends BaseScope {
    kind: 'ai';
    boardWattage: number;
    trainingHours: number;
    inferenceHours: number;
}
interface GamingScope extends BaseScope {
    kind: 'gaming';
    serverWattage: number;
    concurrentPlayers: number;
    hoursOnline: number;
}
interface CustomScope extends BaseScope {
    kind: 'custom';
}
type ScopeInput = WebsiteScope | AIScope | GamingScope | CustomScope;
interface SimulationResult {
    scope: ScopeInput;
    kWhTotal: number;
    breakdown: Record<string, number>;
}
declare function simulate(scope: ScopeInput): SimulationResult;

/**
 * Unified Sustainability Analysis Engine
 */

interface ComprehensiveSustainabilityReport {
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
declare class SustainabilityEngine {
    private projectPath;
    private projectAnalyzer;
    private sustainabilityAnalyzer;
    private carbonAnalyzer;
    private futureAnalyzer;
    private composeAnalyzer;
    private dockerCollector;
    constructor(projectPath?: string);
    generateComprehensiveReport(): Promise<ComprehensiveSustainabilityReport>;
    generateQuickReport(): Promise<any>;
    private calculateOverallSustainability;
    private getSustainabilityCategory;
    private generateActionableInsights;
    private calculateQuickScore;
    private runEnergySimulation;
}

export { AdvancedSustainabilityAnalyzer, CarbonEnergyAnalyzer, ComposeAnalyzer, type ComprehensiveSustainabilityReport, DockerResourceCollector, type ProjectAnalysis, ProjectAnalyzer, ProjectFutureAnalyzer, type SimulationResult, SustainabilityEngine, type SustainabilityMetrics, simulate };
