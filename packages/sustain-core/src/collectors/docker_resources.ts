import { promisify } from "util";
import { exec as execCb } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Estimate storage & memory limits for the Docker images that power a local
 * dev container or docker‑compose stack.
 *
 *   • Scans the nearest docker‑compose file (docker-compose.yml, compose.yml …)
 *   • Reads .devcontainer/devcontainer.json if present
 *   • For every referenced image it calls `docker image inspect` to get the
 *     unpacked size (official Size field)
 *   • For services that declare `mem_limit` or
 *     `deploy.resources.limits.memory`, aggregates those as the memory budget
 *
 * Returned totals are **bytes** (caller can pretty‑print as MiB/GiB).
 */

const exec = promisify(execCb);

export interface ImageResource {
  name: string;
  storageBytes: number;       // layer size, on‑disk
  memoryLimitBytes: number | null; // null → no limit declared
}

export interface DockerResourceSummary {
  images: ImageResource[];
  totalStorageBytes: number;
  /**
   * Sum of declared memory limits. If *no* service declares one, the field is
   * null because any figure would be arbitrary.
   */
  totalMemoryLimitBytes: number | null;
}

export async function collectDockerResources(
  workDir: string = process.cwd(),
): Promise<DockerResourceSummary> {
  const composeFile = await findComposeFile(workDir);
  const images: Set<string> = new Set();
  const memLimits: Record<string, number | null> = {};

  // ── docker‑compose ──────────────────────────────────────────────
  if (composeFile) {
    const { stdout } = await exec(
      `docker compose -f ${composeFile} config --format json`,
    );
    const composeObj = JSON.parse(stdout);

    for (const svc of Object.values<any>(composeObj.services ?? {})) {
      const imgName: string | undefined = svc.image ?? svc.build?.image;
      if (imgName) images.add(imgName);

      // memory limit (two common syntaxes)
      let mem: number | null = null;
      if (svc.mem_limit) mem = parseBytes(svc.mem_limit);
      else if (svc.deploy?.resources?.limits?.memory) {
        mem = parseBytes(svc.deploy.resources.limits.memory);
      }
      if (imgName) memLimits[imgName] = mem;
    }
  }

  // ── .devcontainer/devcontainer.json ────────────────────────────
  const devPath = await findDevContainer(workDir);
  if (devPath) {
    const devCfg = JSON.parse(await fs.readFile(devPath, "utf-8"));
    if (devCfg.image) images.add(devCfg.image);
    // If devcontainer builds a Dockerfile, the final image name is unknown
  }

  // ── Inspect images for size ────────────────────────────────────
  const imageSummaries: ImageResource[] = [];
  let totalSize = 0;
  let totalMem = 0;
  let hasMem = false;

  for (const img of images) {
    const { stdout } = await exec(
      `docker image inspect ${img} --format '{{json .}}'`,
    );
    const meta = JSON.parse(stdout);
    const size: number = meta.Size ?? 0;
    totalSize += size;

    const mem = memLimits[img] ?? null;
    if (mem !== null) {
      totalMem += mem;
      hasMem = true;
    }

    imageSummaries.push({
      name: img,
      storageBytes: size,
      memoryLimitBytes: mem,
    });
  }

  return {
    images: imageSummaries,
    totalStorageBytes: totalSize,
    totalMemoryLimitBytes: hasMem ? totalMem : null,
  };
}

// ──────────────────────────────────────────────────────────────────

function parseBytes(spec: string): number | null {
  // Accepts Docker units like "512m", "2g", "1024k"
  const m = /^(\d+(?:\.\d+)?)([kKmMgG])?b?$/.exec(spec.trim());
  if (!m) return null;
  const val = parseFloat(m[1]);
  const unit = m[2]?.toLowerCase();
  const pow = unit === "k" ? 10 : unit === "m" ? 20 : unit === "g" ? 30 : 0;
  return val * 2 ** pow;
}

async function findComposeFile(dir: string): Promise<string | null> {
  const names = [
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml",
  ];
  for (const name of names) {
    const p = path.join(dir, name);
    try {
      await fs.access(p);
      return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function findDevContainer(dir: string): Promise<string | null> {
  const p = path.join(dir, ".devcontainer", "devcontainer.json");
  try {
    await fs.access(p);
    return p;
  } catch {
    return null;
  }
}
