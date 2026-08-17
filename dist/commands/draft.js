import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import path from 'node:path';
import { Box, render, Text, useApp, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { useEffect, useState } from 'react';
import { createPrompt, resolveProject } from '../api.js';
import { getCredentials } from '../config.js';
import { locateProjectDir } from '../project-locate.js';
import { rememberProjectPath } from '../project-cache.js';
import { scanProject } from '../scan.js';
// ANSI Shadow — 85 colunas. Só cabe em terminais bem largos, então tem um fallback abaixo pra
// quando a janela é mais estreita que isso (não dá pra fazer "scroll lateral" num terminal real).
const BIG_SIGNATURE = [
    '█████╗ ██╗     ███████╗██╗  ██╗███████╗ █████╗ ███╗   ██╗██████╗ ██████╗ ██╗ █████╗ ',
    '██╔══██╗██║     ██╔════╝██║ ██╔╝██╔════╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗██║██╔══██╗',
    '███████║██║     █████╗  █████╔╝ ███████╗███████║██╔██╗ ██║██║  ██║██████╔╝██║███████║',
    '██╔══██║██║     ██╔══╝  ██╔═██╗ ╚════██║██╔══██║██║╚██╗██║██║  ██║██╔══██╗██║██╔══██║',
    '██║  ██║███████╗███████╗██║  ██╗███████║██║  ██║██║ ╚████║██████╔╝██║  ██║██║██║  ██║',
    '╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝',
];
const BIG_SIGNATURE_WIDTH = Math.max(...BIG_SIGNATURE.map((line) => line.length));
function Signature() {
    const { stdout } = useStdout();
    // +4 pra sobrar espaço pra borda/padding do Box em volta.
    const fitsBigSignature = stdout.columns >= BIG_SIGNATURE_WIDTH + 4;
    if (!fitsBigSignature) {
        return (_jsx(Text, { bold: true, color: "magenta", children: "aleksandria" }));
    }
    return (_jsx(Box, { flexDirection: "column", children: BIG_SIGNATURE.map((line, i) => (_jsx(Text, { color: "magenta", children: line }, i))) }));
}
function ScanSummary({ context }) {
    const found = [
        context.claudeMd && 'CLAUDE.md',
        context.readme && 'README.md',
        context.recentCommits.length > 0 && 'git log -10',
    ].filter(Boolean);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 1, marginBottom: 1, children: [_jsx(Signature, {}), _jsxs(Text, { color: "gray", children: ["escaneando ", path.basename(context.path), "\u2026"] }), _jsx(Text, { color: "gray", children: found.length > 0 ? found.join(' · ') : 'nenhum CLAUDE.md/README/git log encontrado' }), context.remote && (_jsxs(Text, { color: "gray", children: ["remote \u2192 ", context.remote.owner, "/", context.remote.repo] }))] }));
}
export function TitleStep({ onSubmit }) {
    const [value, setValue] = useState('');
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "gray", children: "# t\u00EDtulo do prompt" }), _jsxs(Box, { children: [_jsx(Text, { color: "magenta", children: '> ' }), _jsx(TextInput, { value: value, onChange: setValue, onSubmit: (submitted) => {
                            if (submitted.trim()) {
                                onSubmit(submitted.trim());
                            }
                        } })] })] }));
}
/**
 * Campo de várias linhas: Enter quebra linha (permite parágrafos), Ctrl+D finaliza — não usa
 * "enter duas vezes" pra não impedir linha em branco de propósito no meio da descrição.
 */
export function DescriptionStep({ onFinish }) {
    const [lines, setLines] = useState(['']);
    useInput((input, key) => {
        if (key.ctrl && input === 'd') {
            onFinish(lines.join('\n').trimEnd());
            return;
        }
        setLines((prev) => {
            const lastIndex = prev.length - 1;
            const current = prev[lastIndex];
            if (key.return) {
                return [...prev, ''];
            }
            if (key.backspace || key.delete) {
                if (current.length > 0) {
                    return [...prev.slice(0, lastIndex), current.slice(0, -1)];
                }
                return prev.length > 1 ? prev.slice(0, -1) : prev;
            }
            if (key.ctrl || key.meta || !input) {
                return prev;
            }
            return [...prev.slice(0, lastIndex), current + input];
        });
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "gray", children: "# descri\u00E7\u00E3o da feature (Ctrl+D quando terminar)" }), lines.map((line, i) => (_jsxs(Text, { children: [_jsx(Text, { color: "magenta", children: i === 0 ? '> ' : '  ' }), line, i === lines.length - 1 && (_jsx(Text, { inverse: true, children: " " }))] }, i)))] }));
}
function PromptPreview({ title, description }) {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "gray", paddingX: 1, marginY: 1, children: [_jsx(Text, { bold: true, children: title }), _jsx(Text, { color: "gray", children: description || '(sem descrição)' })] }));
}
export function DraftFlow({ context, onSave, }) {
    const [step, setStep] = useState('title');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const { exit } = useApp();
    useEffect(() => {
        if (step !== 'saving') {
            return;
        }
        onSave(title, description)
            .then((saved) => {
            setResult(saved);
            setStep('done');
        })
            .catch((err) => {
            setError(err.message);
            setStep('error');
        });
    }, [step, title, description, onSave]);
    useEffect(() => {
        if (step === 'done' || step === 'cancelled' || step === 'error') {
            exit();
        }
    }, [step, exit]);
    useInput((input, key) => {
        if (step !== 'confirm') {
            return;
        }
        if (key.return || input.toLowerCase() === 'y') {
            setStep('saving');
        }
        else if (key.escape || input.toLowerCase() === 'n') {
            setStep('cancelled');
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(ScanSummary, { context: context }), step === 'title' && (_jsx(TitleStep, { onSubmit: (value) => {
                    setTitle(value);
                    setStep('description');
                } })), step === 'description' && (_jsx(DescriptionStep, { onFinish: (text) => {
                    setDescription(text);
                    setStep('confirm');
                } })), (step === 'confirm' || step === 'saving' || step === 'done' || step === 'error') && (_jsxs(_Fragment, { children: [_jsx(PromptPreview, { title: title, description: description }), step === 'confirm' && _jsx(Text, { color: "yellow", children: "Salvar esse prompt? [Y/n]" }), step === 'saving' && (_jsxs(Text, { color: "magenta", children: [_jsx(Spinner, { type: "dots" }), " salvando..."] })), step === 'done' && result && (_jsxs(Text, { color: "green", children: ["\u2714 prompt #", result.prompt.id, " salvo", !result.projectLinked && ' (sem projeto vinculado)', " \u2014 \"aleksandria run", ' ', result.prompt.id, "\" quando quiser executar."] })), step === 'error' && _jsxs(Text, { color: "red", children: ["\u2716 ", error] })] })), step === 'cancelled' && _jsx(Text, { color: "gray", children: "cancelado." })] }));
}
export async function runDraft(nameArg, cwd) {
    const credentials = getCredentials();
    const projectDir = locateProjectDir(cwd, nameArg);
    const context = scanProject(projectDir);
    async function save(title, description) {
        let projectId = null;
        let projectLinked = false;
        if (context.remote) {
            const resolved = await resolveProject(credentials, context.remote.owner, context.remote.repo);
            if (resolved) {
                projectId = resolved.id;
                projectLinked = true;
                rememberProjectPath(resolved.id, projectDir);
            }
        }
        const prompt = await createPrompt(credentials, {
            project_id: projectId,
            title,
            body: description,
            source: 'cli',
            context_snapshot: {
                remote: context.remote ? `${context.remote.owner}/${context.remote.repo}` : null,
                packageDescription: context.packageDescription,
                hadClaudeMd: Boolean(context.claudeMd),
                hadReadme: Boolean(context.readme),
            },
        });
        return { prompt, projectLinked };
    }
    const { waitUntilExit } = render(_jsx(DraftFlow, { context: context, onSave: save }));
    await waitUntilExit();
}
