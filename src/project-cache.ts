import fs from 'node:fs';
import path from 'node:path';
import { configDir } from './config.js';

/**
 * Mapa project_id → caminho absoluto local, preenchido pelo `draft` (que já resolve o
 * project_id via /api/projects/resolve) e consumido pelo `run` — assim `run` não precisa de
 * mais nenhum campo de GitHub na resposta de /api/prompts.
 */
type ProjectCache = Record<number, string>;

function cachePath(): string {
  return path.join(configDir(), 'projects.json');
}

function readCache(): ProjectCache {
  const file = cachePath();
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as ProjectCache;
  } catch {
    return {};
  }
}

export function getCachedProjectPath(projectId: number): string | undefined {
  const entry = readCache()[projectId];
  return entry && fs.existsSync(entry) ? entry : undefined;
}

export function rememberProjectPath(projectId: number, absolutePath: string): void {
  const cache = readCache();
  cache[projectId] = absolutePath;
  fs.mkdirSync(configDir(), { recursive: true });
  fs.writeFileSync(cachePath(), JSON.stringify(cache, null, 2) + '\n', 'utf-8');
}
