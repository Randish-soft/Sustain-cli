// src/simulation/kwh.ts
//--------------------------------------------------------------
//  ❖  Sustain-CLI  ‣  kWh Simulation module
//--------------------------------------------------------------
import * as path from 'node:path';
import { readFile } from 'node:fs/promises';

/* ============================================================
 *  Types
 * ========================================================== */
export type ScopeKind = 'website' | 'ai' | 'gaming' | 'custom';

export interface BaseScope {
  kind: ScopeKind;
  name: string;
}

export interface WebsiteScope extends BaseScope {
  kind: 'website';
  serverWattage: number;   // W
  hoursOnline: number;     // h / month
  pageViews: number;       // per month
  osShare?: { windows?: number; macos?: number; linux?: number };
}

export interface AIScope extends BaseScope {
  kind: 'ai';
  boardWattage: number;    // W
  trainingHours: number;   // h / month
  inferenceHours: number;  // h / month
}

export interface GamingScope extends BaseScope {
  kind: 'gaming';
  serverWattage: number;   // W
  concurrentPlayers: number;
  hoursOnline: number;     // h / month
}

export interface CustomScope extends BaseScope {
  kind: 'custom';
  // Add optional custom fields here if needed
}

export type ScopeInput = WebsiteScope | AIScope | GamingScope | CustomScope;

export interface SimulationResult {
  scope: ScopeInput;
  kWhTotal: number;
  breakdown: Record<string, number>;
}

/* ============================================================
 *  Public API
 * ========================================================== */
export function simulate(scope: ScopeInput): SimulationResult {
  switch (scope.kind) {
    case 'website':
      return simulateWebsite(scope);
    case 'ai':
      return simulateAI(scope);
    case 'gaming':
      return simulateGaming(scope);
    case 'custom':
    default:
      return { scope, kWhTotal: 0, breakdown: {} };
  }
}

export async function simulateFromCache(
  cacheFile = path.join(process.cwd(), '.sustain', 'scope-cache.json'),
): Promise<SimulationResult[]> {
  const raw = await readFile(cacheFile, 'utf8');
  const scopes: ScopeInput[] = JSON.parse(raw);
  return scopes.map(simulate);
}

/* ============================================================
 *  Internal calculators
 * ========================================================== */
// ---------- 1. Website --------------------------------------
function simulateWebsite(scope: WebsiteScope): SimulationResult {
  const serverKWh = (scope.serverWattage * scope.hoursOnline) / 1_000;

  const PAGE_KWH_DESKTOP = {
    windows: 0.00055,
    macos:   0.00042,
    linux:   0.00060,
    other:   0.00048,
  };
  const share = {
    windows: scope.osShare?.windows ?? 0.65,
    macos:   scope.osShare?.macos   ?? 0.25,
    linux:   scope.osShare?.linux   ?? 0.10,
  };
  const otherShare = 1 - share.windows - share.macos - share.linux;

  const userKWh =
    scope.pageViews *
    (share.windows * PAGE_KWH_DESKTOP.windows +
      share.macos   * PAGE_KWH_DESKTOP.macos   +
      share.linux   * PAGE_KWH_DESKTOP.linux   +
      otherShare    * PAGE_KWH_DESKTOP.other);

  return buildResult(scope, { server: serverKWh, users: userKWh });
}

// ---------- 2. AI -------------------------------------------
function simulateAI(scope: AIScope): SimulationResult {
  const TRAIN_UTIL = 0.9;
  const INF_UTIL   = 0.35;

  const trainingKWh  = (scope.boardWattage * TRAIN_UTIL * scope.trainingHours)  / 1_000;
  const inferenceKWh = (scope.boardWattage * INF_UTIL   * scope.inferenceHours) / 1_000;

  return buildResult(scope, { training: trainingKWh, inference: inferenceKWh });
}

// ---------- 3. Gaming ---------------------------------------
function simulateGaming(scope: GamingScope): SimulationResult {
  const PUE = 1.3;
  const serverKWh = (scope.serverWattage * scope.hoursOnline * PUE) / 1_000;

  return buildResult(scope, { server: serverKWh });
}

/* ============================================================
 *  Helpers
 * ========================================================== */
function round(v: number, d = 3) {
  return Number(v.toFixed(d));
}

function buildResult(
  scope: ScopeInput,
  breakdown: Record<string, number>,
): SimulationResult {
  const rounded = Object.fromEntries(
    Object.entries(breakdown).map(([k, v]) => [k, round(v)]),
  ) as Record<string, number>;
  return {
    scope,
    kWhTotal: round(Object.values(rounded).reduce((a, b) => a + b, 0)),
    breakdown: rounded,
  };
}
