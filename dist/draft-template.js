/**
 * Monta o template que abre no $EDITOR: um espaço em branco sob "## Descrição da feature" pro
 * usuário escrever (pode ter várias linhas — por isso não é pedido no campo de texto do Ink, que
 * é de uma linha só) seguido de um contexto BEM enxuto do projeto. Sem IA (decisão da v1) — o
 * título já foi pedido antes, à parte, e não entra aqui pra não duplicar o campo `title`.
 *
 * De propósito, NÃO inclui o conteúdo de CLAUDE.md/README aqui: quando `aleksandria run` executa
 * o `claude` dentro da própria pasta do projeto, ele já lê esses arquivos sozinho — duplicá-los
 * no corpo do prompt só infla o texto sem agregar nada pra execução (e piora ainda mais em
 * projetos com CLAUDE.md grande). O que sobra é só o que o `claude` NÃO descobre sozinho.
 */
export function buildEditorTemplate(context) {
    const sections = ['## Descrição da feature', '', '', '', '---', 'Contexto do projeto:'];
    if (context.remote) {
        sections.push(`Repositório: ${context.remote.owner}/${context.remote.repo}`);
    }
    if (context.packageDescription) {
        sections.push(context.packageDescription);
    }
    if (context.recentCommits.length > 0) {
        sections.push('', 'Commits recentes:', ...context.recentCommits.map((line) => `- ${line}`));
    }
    return sections.join('\n');
}
