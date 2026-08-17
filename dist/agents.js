export const AGENTS = [
    // claude <prompt> — passa o prompt como argumento posicional direto.
    { id: 'claude', label: 'Claude Code', command: 'claude', args: (prompt) => [prompt] },
    // opencode [project] (default) trata o 1º posicional como diretório — precisa do subcomando
    // "run" pra tratar como mensagem. Mesma CLI (rebrand) pro qaicli.
    { id: 'opencode', label: 'OpenCode', command: 'opencode', args: (prompt) => ['run', prompt] },
    { id: 'qaicli', label: 'QAI CLI', command: 'qaicli', args: (prompt) => ['run', prompt] },
    // binário real é "kiro-cli", subcomando "chat" com o prompt como INPUT posicional.
    { id: 'kiro', label: 'Kiro Dev', command: 'kiro-cli', args: (prompt) => ['chat', prompt] },
];
export function findAgent(id) {
    return AGENTS.find((agent) => agent.id === id);
}
