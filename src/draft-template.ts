import type { ProjectContext } from './scan.js';

/**
 * Monta o template que abre no $EDITOR: um espaço em branco sob "## Descrição da feature" pro
 * usuário escrever (pode ter várias linhas — por isso não é pedido no campo de texto do Ink, que
 * é de uma linha só) seguido do contexto escaneado do projeto, só de referência. Sem IA (decisão
 * da v1) — o título já foi pedido antes, à parte, e não entra aqui pra não duplicar o que já vai
 * no campo `title` do prompt.
 */
export function buildEditorTemplate(context: ProjectContext): string {
  const sections: string[] = ['## Descrição da feature', '', '', '', '---', 'Contexto do projeto:'];

  if (context.remote) {
    sections.push(`Repositório: ${context.remote.owner}/${context.remote.repo}`);
  }

  if (context.packageDescription) {
    sections.push(context.packageDescription);
  }

  if (context.claudeMd) {
    sections.push('', 'CLAUDE.md (trecho):', context.claudeMd.trim());
  }

  if (context.readme) {
    sections.push('', 'README.md (trecho):', context.readme.trim());
  }

  if (context.recentCommits.length > 0) {
    sections.push('', 'Commits recentes:', ...context.recentCommits.map((line) => `- ${line}`));
  }

  return sections.join('\n');
}
