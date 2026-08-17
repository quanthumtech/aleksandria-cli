export interface AgentOption {
  id: string;
  label: string;
  command: string;
}

export const AGENTS: AgentOption[] = [
  { id: 'claude', label: 'Claude Code', command: 'claude' },
  { id: 'opencode', label: 'OpenCode', command: 'opencode' },
  { id: 'qaicli', label: 'QAI CLI', command: 'qaicli' },
  { id: 'kiro', label: 'Kiro Dev', command: 'kiro' },
];

export function findAgent(id: string): AgentOption | undefined {
  return AGENTS.find((agent) => agent.id === id);
}
