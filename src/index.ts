#!/usr/bin/env node
import { Command } from 'commander';
import { AGENTS } from './agents.js';
import { runConfigSet } from './commands/config.js';
import { runDraft } from './commands/draft.js';
import { runList } from './commands/list.js';
import { runRun } from './commands/run.js';
import { runUninstall } from './commands/uninstall.js';
import { runUpdate } from './commands/update.js';
import type { PromptStatus } from './api.js';

const program = new Command();

program.name('aleksandria').description('CLI da Aleksandria — prompts com contexto de projeto').version('0.1.0');

async function guard(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`\n✖ ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

program
  .command('draft [projeto]', { isDefault: true })
  .description('Escaneia o projeto e abre a tela pra compor um prompt')
  .action(async (projeto?: string) => {
    await guard(() => runDraft(projeto, process.cwd()));
  });

program
  .command('list')
  .description('Lista prompts salvos')
  .option('--project <id>', 'filtra por project_id', (v) => parseInt(v, 10))
  .option('--status <status>', 'filtra por status (draft|queued|running|done|failed)')
  .action(async (opts: { project?: number; status?: PromptStatus }) => {
    await guard(() => runList(opts));
  });

program
  .command('run <id>')
  .description('Executa um prompt salvo com o agente escolhido, na pasta local do projeto')
  .option('--path <dir>', 'caminho local do projeto (se não estiver em cache)')
  .option(
    '--agent <nome>',
    `agente pra rodar o prompt (${AGENTS.map((a) => a.id).join('|')}) — pula a lista interativa`,
  )
  .action(async (id: string, opts: { path?: string; agent?: string }) => {
    await guard(() => runRun(parseInt(id, 10), opts));
  });

program
  .command('update')
  .description('Atualiza o aleksandria-cli (git pull + rebuild em ~/.aleksandria-cli)')
  .action(() => {
    try {
      runUpdate();
    } catch (err) {
      console.error(`\n✖ ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program
  .command('uninstall')
  .description('Remove o aleksandria-cli (~/.aleksandria-cli e o link global)')
  .option('--purge-config', 'também remove ~/.config/aleksandria (url/token salvos)')
  .action((opts: { purgeConfig?: boolean }) => {
    try {
      runUninstall(opts);
    } catch (err) {
      console.error(`\n✖ ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

const config = program.command('config').description('Configura URL e token da Aleksandria');
config
  .command('set')
  .description('Define url e/ou token')
  .option('--url <url>', 'URL da instância da Aleksandria')
  .option('--token <token>', 'Token de API (Settings › Prompts (API))')
  .action((opts: { url?: string; token?: string }) => {
    try {
      runConfigSet(opts);
    } catch (err) {
      console.error(`\n✖ ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program.parse();
