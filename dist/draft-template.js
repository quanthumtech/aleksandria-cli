/**
 * Monta o corpo do prompt combinando a descrição digitada com o contexto escaneado do projeto —
 * sem chamar nenhuma API de IA (decisão da v1): o usuário revisa/edita antes de salvar.
 */
export function buildDraft(description, context) {
    const sections = [description.trim(), '', '---', 'Contexto do projeto:'];
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
