import path from 'node:path';
import { Box, render, Text, useApp, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { useEffect, useState } from 'react';
import { createPrompt, resolveProject, type Prompt } from '../api.js';
import type { Credentials } from '../config.js';
import { getCredentials } from '../config.js';
import { locateProjectDir } from '../project-locate.js';
import { rememberProjectPath } from '../project-cache.js';
import { scanProject, type ProjectContext } from '../scan.js';

// ANSI Shadow — 119 colunas. Só cabe em terminais bem largos, então tem um fallback abaixo pra
// quando a janela é mais estreita que isso (não dá pra fazer "scroll lateral" num terminal real).
const BIG_SIGNATURE = [
  '█████╗ ██╗     ███████╗██╗  ██╗███████╗ █████╗ ███╗   ██╗██████╗ ██████╗ ██╗ █████╗                ██████╗██╗     ██╗',
  '██╔══██╗██║     ██╔════╝██║ ██╔╝██╔════╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗██║██╔══██╗              ██╔════╝██║     ██║',
  '███████║██║     █████╗  █████╔╝ ███████╗███████║██╔██╗ ██║██║  ██║██████╔╝██║███████║    █████╗    ██║     ██║     ██║',
  '██╔══██║██║     ██╔══╝  ██╔═██╗ ╚════██║██╔══██║██║╚██╗██║██║  ██║██╔══██╗██║██╔══██║    ╚════╝    ██║     ██║     ██║',
  '██║  ██║███████╗███████╗██║  ██╗███████║██║  ██║██║ ╚████║██████╔╝██║  ██║██║██║  ██║              ╚██████╗███████╗██║',
  '╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝               ╚═════╝╚══════╝╚═╝',
];
const BIG_SIGNATURE_WIDTH = Math.max(...BIG_SIGNATURE.map((line) => line.length));

function Signature() {
  const { stdout } = useStdout();
  // +4 pra sobrar espaço pra borda/padding do Box em volta.
  const fitsBigSignature = stdout.columns >= BIG_SIGNATURE_WIDTH + 4;

  if (!fitsBigSignature) {
    return (
      <Text bold color="magenta">
        aleksandria
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      {BIG_SIGNATURE.map((line, i) => (
        <Text key={i} color="magenta">
          {line}
        </Text>
      ))}
    </Box>
  );
}

function ScanSummary({ context }: { context: ProjectContext }) {
  const found = [
    context.claudeMd && 'CLAUDE.md',
    context.readme && 'README.md',
    context.recentCommits.length > 0 && 'git log -10',
  ].filter(Boolean) as string[];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      marginBottom={1}
    >
      <Signature />
      <Text color="gray">escaneando {path.basename(context.path)}…</Text>
      <Text color="gray">
        {found.length > 0 ? found.join(' · ') : 'nenhum CLAUDE.md/README/git log encontrado'}
      </Text>
      {context.remote && (
        <Text color="gray">
          remote → {context.remote.owner}/{context.remote.repo}
        </Text>
      )}
    </Box>
  );
}

export function TitleStep({ onSubmit }: { onSubmit: (title: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <Box flexDirection="column">
      <Text color="gray"># título do prompt</Text>
      <Box>
        <Text color="magenta">{'> '}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={(submitted) => {
            if (submitted.trim()) {
              onSubmit(submitted.trim());
            }
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * Campo de várias linhas: Enter quebra linha (permite parágrafos), Ctrl+D finaliza — não usa
 * "enter duas vezes" pra não impedir linha em branco de propósito no meio da descrição.
 */
export function DescriptionStep({ onFinish }: { onFinish: (text: string) => void }) {
  const [lines, setLines] = useState<string[]>(['']);

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

  return (
    <Box flexDirection="column">
      <Text color="gray"># descrição da feature (Ctrl+D quando terminar)</Text>
      {lines.map((line, i) => (
        <Text key={i}>
          <Text color="magenta">{i === 0 ? '> ' : '  '}</Text>
          {line}
          {i === lines.length - 1 && (
            <Text inverse> </Text>
          )}
        </Text>
      ))}
    </Box>
  );
}

function PromptPreview({ title, description }: { title: string; description: string }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} marginY={1}>
      <Text bold>{title}</Text>
      <Text color="gray">{description || '(sem descrição)'}</Text>
    </Box>
  );
}

type Step = 'title' | 'description' | 'confirm' | 'saving' | 'done' | 'cancelled' | 'error';

interface SaveResult {
  prompt: Prompt;
  projectLinked: boolean;
}

export function DraftFlow({
  context,
  onSave,
}: {
  context: ProjectContext;
  onSave: (title: string, description: string) => Promise<SaveResult>;
}) {
  const [step, setStep] = useState<Step>('title');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<SaveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      .catch((err: unknown) => {
        setError((err as Error).message);
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
    } else if (key.escape || input.toLowerCase() === 'n') {
      setStep('cancelled');
    }
  });

  return (
    <Box flexDirection="column">
      <ScanSummary context={context} />

      {step === 'title' && (
        <TitleStep
          onSubmit={(value) => {
            setTitle(value);
            setStep('description');
          }}
        />
      )}

      {step === 'description' && (
        <DescriptionStep
          onFinish={(text) => {
            setDescription(text);
            setStep('confirm');
          }}
        />
      )}

      {(step === 'confirm' || step === 'saving' || step === 'done' || step === 'error') && (
        <>
          <PromptPreview title={title} description={description} />
          {step === 'confirm' && <Text color="yellow">Salvar esse prompt? [Y/n]</Text>}
          {step === 'saving' && (
            <Text color="magenta">
              <Spinner type="dots" /> salvando...
            </Text>
          )}
          {step === 'done' && result && (
            <Text color="green">
              ✔ prompt #{result.prompt.id} salvo
              {!result.projectLinked && ' (sem projeto vinculado)'} — &quot;aleksandria run{' '}
              {result.prompt.id}&quot; quando quiser executar.
            </Text>
          )}
          {step === 'error' && <Text color="red">✖ {error}</Text>}
        </>
      )}

      {step === 'cancelled' && <Text color="gray">cancelado.</Text>}
    </Box>
  );
}

export async function runDraft(nameArg: string | undefined, cwd: string): Promise<void> {
  const credentials: Credentials = getCredentials();
  const projectDir = locateProjectDir(cwd, nameArg);
  const context = scanProject(projectDir);

  async function save(title: string, description: string): Promise<SaveResult> {
    let projectId: number | null = null;
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

  const { waitUntilExit } = render(<DraftFlow context={context} onSave={save} />);
  await waitUntilExit();
}
