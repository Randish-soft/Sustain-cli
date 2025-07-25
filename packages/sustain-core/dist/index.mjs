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

// src/index.ts
function placeholder() {
  return "Hello, Sustain";
}
export {
  DockerResourceCollector,
  placeholder
};
//# sourceMappingURL=index.mjs.map