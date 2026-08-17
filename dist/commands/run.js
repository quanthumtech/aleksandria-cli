import { spawn } from 'node:child_process';
import { AGENTS, findAgent } from '../agents.js';
import { getPrompt, updatePrompt } from '../api.js';
import { getCredentials, readConfig, writeConfig } from '../config.js';
import { getCachedProjectPath, rememberProjectPath } from '../project-cache.js';
import { pickAgent } from './agent-picker.js';
async function resolveAgent(agentId) {
    if (agentId) {
        const agent = findAgent(agentId);
        if (!agent) {
            throw new Error(`Agente "${agentId}" desconhecido. Opções: ${AGENTS.map((a) => a.id).join(', ')}.`);
        }
        return agent;
    }
    const config = readConfig();
    const chosen = await pickAgent(AGENTS, config.agent);
    writeConfig({ agent: chosen.id });
    return chosen;
}
export async function runRun(id, options) {
    const credentials = getCredentials();
    const prompt = await getPrompt(credentials, id);
    if (!prompt) {
        throw new Error(`Prompt #${id} não encontrado.`);
    }
    const localPath = options.path ?? (prompt.project_id ? getCachedProjectPath(prompt.project_id) : undefined);
    if (!localPath) {
        throw new Error(`Não sei onde fica o projeto desse prompt localmente — rode "aleksandria draft" nesse projeto` +
            ' pelo menos uma vez, ou passe "--path <pasta>".');
    }
    if (prompt.project_id && options.path) {
        rememberProjectPath(prompt.project_id, options.path);
    }
    const agent = await resolveAgent(options.agent);
    await updatePrompt(credentials, id, { status: 'running' });
    console.log(`→ cd ${localPath}`);
    console.log(`→ ${agent.command} "${prompt.title}"   [running]`);
    const startedAt = Date.now();
    const exitCode = await new Promise((resolve) => {
        const child = spawn(agent.command, [prompt.body], { cwd: localPath, stdio: 'inherit' });
        child.on('close', (code) => resolve(code ?? 1));
        child.on('error', () => resolve(1));
    });
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    await updatePrompt(credentials, id, {
        status: exitCode === 0 ? 'done' : 'failed',
        result_notes: `exit code ${exitCode} · ${durationSeconds}s`,
        executed_at: new Date().toISOString(),
    });
    console.log(exitCode === 0 ? '✔ concluído' : `✖ falhou (exit code ${exitCode})`);
}
