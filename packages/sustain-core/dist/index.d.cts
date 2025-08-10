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
declare function simulateFromCache(cacheFile?: string): Promise<SimulationResult[]>;

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

export { ComposeAnalyzer, DockerResourceCollector, ProjectAnalyzer, simulate, simulateFromCache };
