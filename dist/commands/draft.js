import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Box, render, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import { createPrompt, resolveProject } from '../api.js';
import { getCredentials } from '../config.js';
import { buildEditorTemplate } from '../draft-template.js';
import { locateProjectDir } from '../project-locate.js';
import { rememberProjectPath } from '../project-cache.js';
import { scanProject } from '../scan.js';
function ScanSummary({ context }) {
    const found = [
        context.claudeMd && 'CLAUDE.md',
        context.readme && 'README.md',
        context.recentCommits.length > 0 && 'git log -10',
    ].filter(Boolean);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 1, marginBottom: 1, children: [_jsx(Text, { bold: true, color: "magenta", children: "aleksandria" }), _jsxs(Text, { color: "gray", children: ["escaneando ", path.basename(context.path), "\u2026"] }), _jsx(Text, { color: "gray", children: found.length > 0 ? found.join(' · ') : 'nenhum CLAUDE.md/README/git log encontrado' }), context.remote && (_jsxs(Text, { color: "gray", children: ["remote \u2192 ", context.remote.owner, "/", context.remote.repo] }))] }));
}
export function DraftScreen({ context, onSubmit, }) {
    const [value, setValue] = useState('');
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(ScanSummary, { context: context }), _jsx(Text, { color: "gray", children: "# t\u00EDtulo do prompt" }), _jsxs(Box, { children: [_jsx(Text, { color: "magenta", children: '> ' }), _jsx(TextInput, { value: value, onChange: setValue, onSubmit: (submitted) => {
                            if (submitted.trim()) {
                                onSubmit(submitted.trim());
                            }
                        } })] }), _jsx(Text, { color: "gray", children: "a descri\u00E7\u00E3o da feature (pode ter v\u00E1rias linhas) \u00E9 escrita no editor, no pr\u00F3ximo passo." })] }));
}
function askTitle(context) {
    return new Promise((resolve) => {
        const { unmount } = render(_jsx(DraftScreen, { context: context, onSubmit: (title) => {
                unmount();
                resolve(title);
            } }));
    });
}
/** Abre $EDITOR (ou $VISUAL, ou nano) num arquivo temporário pré-preenchido e devolve o conteúdo salvo. */
function editInEditor(initialContent) {
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
    const tmpFile = path.join(os.tmpdir(), `aleksandria-draft-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, initialContent, 'utf-8');
    // O <TextInput> do Ink desliga o raw mode do stdin dentro de um useEffect de cleanup, que o
    // React só roda de forma assíncrona depois do unmount() — sem isso, o editor pode herdar o
    // stdin ainda em raw mode e ler a tecla errada como comando assim que abre.
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
    const result = spawnSync(editor, [tmpFile], { stdio: 'inherit' });
    if (result.error) {
        fs.rmSync(tmpFile, { force: true });
        throw new Error(`Não consegui abrir o editor "${editor}": ${result.error.message}`);
    }
    const edited = fs.readFileSync(tmpFile, 'utf-8');
    fs.rmSync(tmpFile, { force: true });
    return edited;
}
export async function runDraft(nameArg, cwd) {
    const credentials = getCredentials();
    const projectDir = locateProjectDir(cwd, nameArg);
    const context = scanProject(projectDir);
    const title = await askTitle(context);
    const editorTemplate = buildEditorTemplate(context);
    // Dá um tick pro React terminar de desmontar a tela do Ink (o cleanup do raw mode do stdin
    // roda num useEffect assíncrono) antes de entregar o terminal pro editor.
    await new Promise((resolve) => setImmediate(resolve));
    console.log('→ escreve a descrição da feature no editor, salva e fecha pra continuar…');
    const finalBody = editInEditor(editorTemplate);
    let projectId = null;
    if (context.remote) {
        const resolved = await resolveProject(credentials, context.remote.owner, context.remote.repo);
        if (resolved) {
            projectId = resolved.id;
            rememberProjectPath(resolved.id, projectDir);
        }
        else {
            console.log(`⚠ "${context.remote.owner}/${context.remote.repo}" não está cadastrado na Aleksandria — salvando sem projeto vinculado.`);
        }
    }
    const prompt = await createPrompt(credentials, {
        project_id: projectId,
        title,
        body: finalBody,
        source: 'cli',
        context_snapshot: {
            remote: context.remote ? `${context.remote.owner}/${context.remote.repo}` : null,
            hadClaudeMd: Boolean(context.claudeMd),
            hadReadme: Boolean(context.readme),
            recentCommits: context.recentCommits,
        },
    });
    console.log(`✔ prompt #${prompt.id} salvo — "aleksandria run ${prompt.id}" quando quiser executar.`);
}
