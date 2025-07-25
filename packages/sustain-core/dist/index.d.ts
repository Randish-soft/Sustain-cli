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

declare function placeholder(): string;

export { type ComposeAnalysis, ComposeAnalyzer, type ComposeService, type DockerContainer, DockerResourceCollector, type DockerResources, placeholder };
