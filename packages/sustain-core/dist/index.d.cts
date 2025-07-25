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

declare function placeholder(): string;

export { type DockerContainer, DockerResourceCollector, type DockerResources, placeholder };
