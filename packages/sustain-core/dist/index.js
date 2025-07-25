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

// src/index.ts
function placeholder() {
  return "Hello, Sustain";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DockerResourceCollector,
  placeholder
});
//# sourceMappingURL=index.js.map