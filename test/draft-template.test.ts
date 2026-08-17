import { describe, expect, it } from 'vitest';
import { buildDraft } from '../src/draft-template.js';
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

describe('buildDraft', () => {
  it('inclui a descrição e o contexto disponível', () => {
    const draft = buildDraft('adicionar export csv', context({
      remote: { owner: 'quanthumtech', repo: 'docs-hub' },
      claudeMd: 'Use Sail pra tudo.',
      readme: '# docs-hub',
      recentCommits: ['abc123 fix: algo', 'def456 feat: outro'],
    }));

    expect(draft).toContain('adicionar export csv');
    expect(draft).toContain('quanthumtech/docs-hub');
    expect(draft).toContain('Use Sail pra tudo.');
    expect(draft).toContain('# docs-hub');
    expect(draft).toContain('- abc123 fix: algo');
    expect(draft).toContain('- def456 feat: outro');
  });

  it('ainda funciona sem nenhum contexto encontrado', () => {
    const draft = buildDraft('feature sem contexto', context());

    expect(draft).toContain('feature sem contexto');
    expect(draft).toContain('Contexto do projeto:');
  });
});
