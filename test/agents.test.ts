import { describe, expect, it } from 'vitest';
import { AGENTS, findAgent } from '../src/agents.js';

describe('findAgent', () => {
  it('acha o agente pelo id', () => {
    expect(findAgent('claude')).toEqual({ id: 'claude', label: 'Claude Code', command: 'claude' });
  });

  it('devolve undefined pra id desconhecido', () => {
    expect(findAgent('não-existe')).toBeUndefined();
  });

  it('tem um id único por agente', () => {
    const ids = AGENTS.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
