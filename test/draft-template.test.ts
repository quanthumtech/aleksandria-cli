import { describe, expect, it } from 'vitest';
import { buildEditorTemplate } from '../src/draft-template.js';
import type { ProjectContext } from '../src/scan.js';

function context(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    path: '/tmp/projeto',
    claudeMd: null,
    readme: null,
    packageDescription: null,
    remote: null,
    recentCommits: [],
    ...overrides,
  };
}

describe('buildEditorTemplate', () => {
  it('inclui o cabeçalho da descrição e o contexto disponível', () => {
    const template = buildEditorTemplate(context({
      remote: { owner: 'quanthumtech', repo: 'docs-hub' },
      claudeMd: 'Use Sail pra tudo.',
      readme: '# docs-hub',
      recentCommits: ['abc123 fix: algo', 'def456 feat: outro'],
    }));

    expect(template).toContain('## Descrição da feature');
    expect(template).toContain('quanthumtech/docs-hub');
    expect(template).toContain('Use Sail pra tudo.');
    expect(template).toContain('# docs-hub');
    expect(template).toContain('- abc123 fix: algo');
    expect(template).toContain('- def456 feat: outro');
  });

  it('deixa espaço em branco pro usuário escrever, antes do contexto', () => {
    const template = buildEditorTemplate(context());
    const [header, ...rest] = template.split('\n');

    expect(header).toBe('## Descrição da feature');
    expect(rest.slice(0, 3)).toEqual(['', '', '']);
  });

  it('ainda funciona sem nenhum contexto encontrado', () => {
    const template = buildEditorTemplate(context());

    expect(template).toContain('## Descrição da feature');
    expect(template).toContain('Contexto do projeto:');
  });
});
