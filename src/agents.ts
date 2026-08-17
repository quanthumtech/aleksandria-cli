export interface AgentOption {
  id: string;
  label: string;
  command: string;
  /** Monta os args pro CLI do agente a partir do texto do prompt (body pra rodar, title pra exibir). */
  args: (prompt: string) => string[];
}

export const AGENTS: AgentOption[] = [
  // claude <prompt> — passa o prompt como argumento posicional direto.
  { id: 'claude', label: 'Claude Code', command: 'claude', args: (prompt) => [prompt] },
  // opencode [project] (default) trata o 1º posicional como diretório — precisa do subcomando
  // "run" pra tratar como mensagem. Mesma CLI (rebrand) pro qaicli.
  { id: 'opencode', label: 'OpenCode', command: 'opencode', args: (prompt) => ['run', prompt] },
  { id: 'qaicli', label: 'QAI CLI', command: 'qaicli', args: (prompt) => ['run', prompt] },
  // binário real é "kiro-cli", subcomando "chat" com o prompt como INPUT posicional.
  { id: 'kiro', label: 'Kiro Dev', command: 'kiro-cli', args: (prompt) => ['chat', prompt] },
];

export function findAgent(id: string): AgentOption | undefined {
  return AGENTS.find((agent) => agent.id === id);
}
