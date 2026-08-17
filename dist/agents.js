export const AGENTS = [
    { id: 'claude', label: 'Claude Code', command: 'claude' },
    { id: 'opencode', label: 'OpenCode', command: 'opencode' },
    { id: 'qaicli', label: 'QAI CLI', command: 'qaicli' },
    { id: 'kiro', label: 'Kiro Dev', command: 'kiro' },
];
export function findAgent(id) {
    return AGENTS.find((agent) => agent.id === id);
}
