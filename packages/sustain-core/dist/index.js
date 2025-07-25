var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  collectDockerResources: () => collectDockerResources,
  placeholder: () => placeholder
});
module.exports = __toCommonJS(index_exports);

// src/collectors/docker_resources.ts
var import_util = require("util");
var import_child_process = require("child_process");
var fs = __toESM(require("fs/promises"));
var path = __toESM(require("path"));
var exec = (0, import_util.promisify)(import_child_process.exec);
async function collectDockerResources(workDir = process.cwd()) {
  var _a, _b, _c, _d;
  const composeFile = await findComposeFile(workDir);
  const images = /* @__PURE__ */ new Set();
  const memLimits = {};
  if (composeFile) {
    const { stdout } = await exec(
      `docker compose -f ${composeFile} config --format json`
    );
    const composeObj = JSON.parse(stdout);
    for (const svc of Object.values(composeObj.services ?? {})) {
      const imgName = svc.image ?? ((_a = svc.build) == null ? void 0 : _a.image);
      if (imgName) images.add(imgName);
      let mem = null;
      if (svc.mem_limit) mem = parseBytes(svc.mem_limit);
      else if ((_d = (_c = (_b = svc.deploy) == null ? void 0 : _b.resources) == null ? void 0 : _c.limits) == null ? void 0 : _d.memory) {
        mem = parseBytes(svc.deploy.resources.limits.memory);
      }
      if (imgName) memLimits[imgName] = mem;
    }
  }
  const devPath = await findDevContainer(workDir);
  if (devPath) {
    const devCfg = JSON.parse(await fs.readFile(devPath, "utf-8"));
    if (devCfg.image) images.add(devCfg.image);
  }
  const imageSummaries = [];
  let totalSize = 0;
  let totalMem = 0;
  let hasMem = false;
  for (const img of images) {
    const { stdout } = await exec(
      `docker image inspect ${img} --format '{{json .}}'`
    );
    const meta = JSON.parse(stdout);
    const size = meta.Size ?? 0;
    totalSize += size;
    const mem = memLimits[img] ?? null;
    if (mem !== null) {
      totalMem += mem;
      hasMem = true;
    }
    imageSummaries.push({
      name: img,
      storageBytes: size,
      memoryLimitBytes: mem
    });
  }
  return {
    images: imageSummaries,
    totalStorageBytes: totalSize,
    totalMemoryLimitBytes: hasMem ? totalMem : null
  };
}
function parseBytes(spec) {
  var _a;
  const m = /^(\d+(?:\.\d+)?)([kKmMgG])?b?$/.exec(spec.trim());
  if (!m) return null;
  const val = parseFloat(m[1]);
  const unit = (_a = m[2]) == null ? void 0 : _a.toLowerCase();
  const pow = unit === "k" ? 10 : unit === "m" ? 20 : unit === "g" ? 30 : 0;
  return val * 2 ** pow;
}
async function findComposeFile(dir) {
  const names = [
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml"
  ];
  for (const name of names) {
    const p = path.join(dir, name);
    try {
      await fs.access(p);
      return p;
    } catch {
    }
  }
  return null;
}
async function findDevContainer(dir) {
  const p = path.join(dir, ".devcontainer", "devcontainer.json");
  try {
    await fs.access(p);
    return p;
  } catch {
    return null;
  }
}

// src/index.ts
function placeholder() {
  return "Hello, Sustain";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectDockerResources,
  placeholder
});
