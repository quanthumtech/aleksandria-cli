import { listPrompts, type PromptStatus } from '../api.js';
import { getCredentials } from '../config.js';

export async function runList(options: { project?: number; status?: PromptStatus }): Promise<void> {
  const credentials = getCredentials();
  const prompts = await listPrompts(credentials, { project_id: options.project, status: options.status });

  if (prompts.length === 0) {
    console.log('Nenhum prompt encontrado.');
    return;
  }

  // Sem nome de projeto aqui de propósito — a API de prompts só devolve project_id;
  // resolver o nome exigiria mais uma chamada por linha, sem ganho real pro caso de uso do CLI.
  console.table(
    prompts.map((p) => ({
      id: p.id,
      status: p.status,
      title: p.title,
      project_id: p.project_id ?? '—',
      source: p.source,
      updated_at: p.updated_at,
    })),
  );
}
