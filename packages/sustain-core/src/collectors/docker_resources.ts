import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DockerContainer {
  id: string;
  name: string;
  cpu?: string;
  memory?: string;
  status: string;
}

export interface DockerResources {
  containers: DockerContainer[];
  timestamp: string;
}

export class DockerResourceCollector {
  async collect(): Promise<DockerResources> {
    try {
      // Check if Docker is running
      await execAsync('docker info');
      
      // Get container list
      const { stdout: containerList } = await execAsync('docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}"');
      
      if (!containerList.trim()) {
        return {
          containers: [],
          timestamp: new Date().toISOString()
        };
      }
      
      const containers: DockerContainer[] = [];
      const lines = containerList.trim().split('\n');
      
      for (const line of lines) {
        const [id, name, status] = line.split('|');
        
        try {
          // Get container stats (CPU and Memory)
          const { stdout: stats } = await execAsync(
            `docker stats ${id} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}"`
          );
          
          const [cpu, memory] = stats.trim().split('|');
          
          containers.push({
            id,
            name,
            cpu,
            memory,
            status
          });
        } catch (error) {
          // If stats fail, still include the container
          containers.push({
            id,
            name,
            status,
            cpu: 'N/A',
            memory: 'N/A'
          });
        }
      }
      
      return {
        containers,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      // Docker not running or not installed
      console.error('Docker error:', error);
      return {
        containers: [],
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async getContainerDetails(containerId: string): Promise<DockerContainer | null> {
    try {
      const { stdout: details } = await execAsync(
        `docker inspect ${containerId} --format "{{.Name}}|{{.State.Status}}"`
      );
      
      const [name, status] = details.trim().split('|');
      
      const { stdout: stats } = await execAsync(
        `docker stats ${containerId} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}"`
      );
      
      const [cpu, memory] = stats.trim().split('|');
      
      return {
        id: containerId,
        name: name.replace(/^\//, ''), // Remove leading slash
        cpu,
        memory,
        status
      };
    } catch (error) {
      return null;
    }
  }
}