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
import { scanProject, type ProjectContext } from '../scan.js';

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
      <Text bold color="magenta">
        aleksandria
      </Text>
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

export function DraftScreen({
  context,
  onSubmit,
}: {
  context: ProjectContext;
  onSubmit: (title: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <Box flexDirection="column">
      <ScanSummary context={context} />
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
      <Text color="gray">a descrição da feature (pode ter várias linhas) é escrita no editor, no próximo passo.</Text>
    </Box>
  );
}

function askTitle(context: ProjectContext): Promise<string> {
  return new Promise((resolve) => {
    const { unmount } = render(
      <DraftScreen
        context={context}
        onSubmit={(title) => {
          unmount();
          resolve(title);
        }}
      />,
    );
  });
}

/** Abre $EDITOR (ou $VISUAL, ou nano) num arquivo temporário pré-preenchido e devolve o conteúdo salvo. */
function editInEditor(initialContent: string): string {
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

export async function runDraft(nameArg: string | undefined, cwd: string): Promise<void> {
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

  let projectId: number | null = null;
  if (context.remote) {
    const resolved = await resolveProject(credentials, context.remote.owner, context.remote.repo);
    if (resolved) {
      projectId = resolved.id;
      rememberProjectPath(resolved.id, projectDir);
    } else {
      console.log(
        `⚠ "${context.remote.owner}/${context.remote.repo}" não está cadastrado na Aleksandria — salvando sem projeto vinculado.`,
      );
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
