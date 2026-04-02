/**
 * Habit Intelligence — Local Cache Store
 *
 * Persists API responses to .cache/data/{hash}.json so every subsequent
 * request is served from disk (<5 ms) instead of the remote database.
 *
 * Cache lifecycle:
 *   MISS  → handler runs → result stored → returned to client
 *   HIT   → file read   → returned immediately (no DB touch)
 *   WARM  → npm run cache:warm  (or POST /api/cache/refresh)
 *   CLEAR → npm run cache:clear (or POST /api/cache/refresh?clear=1)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// ── Paths ─────────────────────────────────────────────────────────────────────

const CACHE_ROOT = path.join(process.cwd(), ".cache");
const DATA_DIR = path.join(CACHE_ROOT, "data");
const MANIFEST_PATH = path.join(CACHE_ROOT, "manifest.json");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CacheEntry {
  data: unknown;
  endpoint: string;
  params: Record<string, string>;
  cachedAt: string;
}

export interface EntryMeta {
  endpoint: string;
  cachedAt: string;
  bytes: number;
  hits: number;
}

export interface CacheManifest {
  version: number;
  createdAt: string;
  lastWarmedAt: string | null;
  entries: Record<string, EntryMeta>;
  stats: {
    hits: number;
    misses: number;
    totalBytes: number;
  };
}

// ── Internals ─────────────────────────────────────────────────────────────────

function ensureDirs(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readManifest(): CacheManifest {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as CacheManifest;
  } catch {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      lastWarmedAt: null,
      entries: {},
      stats: { hits: 0, misses: 0, totalBytes: 0 },
    };
  }
}

function writeManifest(m: CacheManifest): void {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Deterministic cache key: SHA-256 of "endpoint|{sorted-params-json}",
 * truncated to 24 hex chars for readable filenames.
 */
export function buildKey(
  endpoint: string,
  params: Record<string, string>
): string {
  const sorted = Object.fromEntries(
    Object.entries(params)
      .filter(([k]) => k !== "nocache") // never part of the key
      .sort(([a], [b]) => a.localeCompare(b))
  );
  const raw = `${endpoint}|${JSON.stringify(sorted)}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

/** Returns cached data, or null on miss. */
export function get(
  endpoint: string,
  params: Record<string, string>
): unknown | null {
  ensureDirs();
  const key = buildKey(endpoint, params);
  const file = path.join(DATA_DIR, `${key}.json`);

  try {
    const entry: CacheEntry = JSON.parse(fs.readFileSync(file, "utf-8"));

    // Fire-and-forget manifest hit counter
    setImmediate(() => {
      const m = readManifest();
      if (m.entries[key]) m.entries[key].hits++;
      m.stats.hits++;
      writeManifest(m);
    });

    return entry.data;
  } catch {
    setImmediate(() => {
      const m = readManifest();
      m.stats.misses++;
      writeManifest(m);
    });
    return null;
  }
}

/** Stores data in cache. Overwrites any existing entry for the same key. */
export function set(
  endpoint: string,
  params: Record<string, string>,
  data: unknown
): void {
  ensureDirs();
  const key = buildKey(endpoint, params);
  const file = path.join(DATA_DIR, `${key}.json`);

  const entry: CacheEntry = {
    data,
    endpoint,
    params,
    cachedAt: new Date().toISOString(),
  };

  const payload = JSON.stringify(entry);
  const bytes = Buffer.byteLength(payload, "utf-8");

  fs.writeFileSync(file, payload);

  const m = readManifest();
  const prevBytes = m.entries[key]?.bytes ?? 0;
  m.entries[key] = {
    endpoint,
    cachedAt: entry.cachedAt,
    bytes,
    hits: m.entries[key]?.hits ?? 0,
  };
  m.stats.totalBytes = m.stats.totalBytes - prevBytes + bytes;
  writeManifest(m);
}

/**
 * Remove cached entries.
 * - No argument → clear everything
 * - endpoint string → clear only that endpoint's entries
 * Returns the number of entries removed.
 */
export function invalidate(endpoint?: string): number {
  const m = readManifest();

  if (!endpoint) {
    const count = Object.keys(m.entries).length;
    try {
      fs.rmSync(DATA_DIR, { recursive: true });
      fs.mkdirSync(DATA_DIR);
    } catch {}
    m.entries = {};
    m.stats.totalBytes = 0;
    writeManifest(m);
    return count;
  }

  const targets = Object.entries(m.entries)
    .filter(([, v]) => v.endpoint === endpoint)
    .map(([k]) => k);

  for (const key of targets) {
    try {
      fs.unlinkSync(path.join(DATA_DIR, `${key}.json`));
    } catch {}
    m.stats.totalBytes -= m.entries[key]?.bytes ?? 0;
    delete m.entries[key];
  }

  writeManifest(m);
  return targets.length;
}

/** Read the full manifest (for stats/introspection). */
export function getManifest(): CacheManifest {
  return readManifest();
}

/** Record the timestamp of the last successful cache warm. */
export function markWarmed(): void {
  const m = readManifest();
  m.lastWarmedAt = new Date().toISOString();
  writeManifest(m);
}

/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
