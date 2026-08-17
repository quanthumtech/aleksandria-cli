import { describe, expect, it } from 'vitest';
import { AGENTS, findAgent } from '../src/agents.js';

describe('findAgent', () => {
  it('acha o agente pelo id', () => {
    expect(findAgent('claude')?.command).toBe('claude');
  });

  it('devolve undefined pra id desconhecido', () => {
    expect(findAgent('não-existe')).toBeUndefined();
  });

  it('tem um id único por agente', () => {
    const ids = AGENTS.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('args', () => {
  it('claude recebe o prompt como argumento posicional direto', () => {
    expect(findAgent('claude')?.args('faz X')).toEqual(['faz X']);
  });

  it('opencode e qaicli usam o subcomando "run" (o positional default é um diretório)', () => {
    expect(findAgent('opencode')?.args('faz X')).toEqual(['run', 'faz X']);
    expect(findAgent('qaicli')?.args('faz X')).toEqual(['run', 'faz X']);
  });

  it('kiro usa o binário kiro-cli com o subcomando "chat"', () => {
    const kiro = findAgent('kiro');
    expect(kiro?.command).toBe('kiro-cli');
    expect(kiro?.args('faz X')).toEqual(['chat', 'faz X']);
  });
});
