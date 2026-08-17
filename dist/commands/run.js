import { spawn } from 'node:child_process';
import { getPrompt, updatePrompt } from '../api.js';
import { getCredentials } from '../config.js';
import { getCachedProjectPath, rememberProjectPath } from '../project-cache.js';
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
    await updatePrompt(credentials, id, { status: 'running' });
    console.log(`→ cd ${localPath}`);
    console.log(`→ claude "${prompt.title}"   [running]`);
    const startedAt = Date.now();
    const exitCode = await new Promise((resolve) => {
        const child = spawn('claude', [prompt.body], { cwd: localPath, stdio: 'inherit' });
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
