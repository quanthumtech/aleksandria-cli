import fs from 'node:fs';
import path from 'node:path';
import { configDir } from './config.js';
function cachePath() {
    return path.join(configDir(), 'projects.json');
}
function readCache() {
    const file = cachePath();
    if (!fs.existsSync(file)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    catch {
        return {};
    }
}
export function getCachedProjectPath(projectId) {
    const entry = readCache()[projectId];
    return entry && fs.existsSync(entry) ? entry : undefined;
}
export function rememberProjectPath(projectId, absolutePath) {
    const cache = readCache();
    cache[projectId] = absolutePath;
    fs.mkdirSync(configDir(), { recursive: true });
    fs.writeFileSync(cachePath(), JSON.stringify(cache, null, 2) + '\n', 'utf-8');
}
