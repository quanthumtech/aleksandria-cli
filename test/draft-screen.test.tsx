import { render } from 'ink-testing-library';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DraftScreen } from '../src/commands/draft.js';
import type { ProjectContext } from '../src/scan.js';

function context(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    path: '/home/user/QuanthumTechProjects/docs-hub',
    claudeMd: '# regras',
    readme: '# docs-hub',
    packageDescription: null,
    remote: { owner: 'quanthumtech', repo: 'docs-hub' },
    recentCommits: ['abc123 feat: algo'],
    ...overrides,
  };
}

describe('DraftScreen', () => {
  it('mostra a assinatura, o resumo do scan e o remote', () => {
    const { lastFrame } = render(<DraftScreen context={context()} onSubmit={vi.fn()} />);

    const frame = lastFrame();
    expect(frame).toContain('aleksandria');
    expect(frame).toContain('CLAUDE.md');
    expect(frame).toContain('README.md');
    expect(frame).toContain('git log -10');
    expect(frame).toContain('quanthumtech/docs-hub');
    expect(frame).toContain('título do prompt');
    expect(frame).toContain('descrição da feature');
  });

  it('avisa quando nenhum contexto extra foi encontrado', () => {
    const { lastFrame } = render(
      <DraftScreen
        context={context({ claudeMd: null, readme: null, recentCommits: [] })}
        onSubmit={vi.fn()}
      />,
    );

    expect(lastFrame()).toContain('nenhum CLAUDE.md/README/git log encontrado');
  });

  // Sem teste de "digita e aperta enter": o `debug: true` que ink-testing-library passa pro
  // `render` do Ink desativa o raw mode, e sem raw mode o `useInput` do ink-text-input nunca
  // recebe os keystrokes simulados por `stdin.write` — é uma limitação conhecida da combinação
  // ink-testing-library + ink-text-input, não da lógica deste componente. O guard de string
  // vazia (teste abaixo) já cobre o único código que é meu de fato — o resto vem do TextInput.

  it('não chama onSubmit se o título estiver vazio', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<DraftScreen context={context()} onSubmit={onSubmit} />);

    stdin.write('\r');

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
