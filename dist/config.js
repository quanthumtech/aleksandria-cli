import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export function configDir() {
    return path.join(os.homedir(), '.config', 'aleksandria');
}
function configPath() {
    return path.join(configDir(), 'config.json');
}
export function readConfig() {
    const file = configPath();
    if (!fs.existsSync(file)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    catch {
        throw new Error(`"${file}" não é um JSON válido.`);
    }
}
export function writeConfig(patch) {
    const current = readConfig();
    const next = { ...current, ...patch };
    fs.mkdirSync(configDir(), { recursive: true });
    fs.writeFileSync(configPath(), JSON.stringify(next, null, 2) + '\n', 'utf-8');
    return next;
}
/**
 * Env vars sempre vencem o arquivo — útil pra CI ou pra sobrepor sem editar o config.
 */
export function getCredentials() {
    const config = readConfig();
    const url = process.env.ALEKSANDRIA_URL ?? config.url;
    const token = process.env.ALEKSANDRIA_TOKEN ?? config.token;
    if (!url || !token) {
        throw new Error('Aleksandria não está configurada. Rode:\n' +
            '  aleksandria config set --url <url>\n' +
            '  aleksandria config set --token <token>\n' +
            '(gere o token em Settings › Prompts (API) na própria Aleksandria)');
    }
    return { url: url.replace(/\/+$/, ''), token };
}
