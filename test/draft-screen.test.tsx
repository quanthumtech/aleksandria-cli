import { render } from 'ink-testing-library';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DescriptionStep, DraftFlow, TitleStep } from '../src/commands/draft.js';
import type { ProjectContext } from '../src/scan.js';

// ink-testing-library passa `debug: true` pro render do Ink, o que desativa o raw mode — sem raw
// mode, `useInput` (usado direto no DescriptionStep e via TextInput no TitleStep) nunca recebe os
// keystrokes simulados por `stdin.write`. É uma limitação conhecida da combinação
// ink-testing-library + Ink v5, não da lógica destes componentes — por isso os testes abaixo
// cobrem render estático e os guards que não dependem de keystroke chegar (ex.: nada dispara
// sozinho no mount), não a digitação em si.

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

describe('TitleStep', () => {
  it('mostra o rótulo e não chama onSubmit sozinho', () => {
    const onSubmit = vi.fn();
    const { lastFrame } = render(<TitleStep onSubmit={onSubmit} />);

    expect(lastFrame()).toContain('título do prompt');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('DescriptionStep', () => {
  it('mostra o rótulo com a dica do Ctrl+D e o cursor inicial', () => {
    const onFinish = vi.fn();
    const { lastFrame } = render(<DescriptionStep onFinish={onFinish} />);

    expect(lastFrame()).toContain('Ctrl+D quando terminar');
    expect(onFinish).not.toHaveBeenCalled();
  });
});

describe('DraftFlow', () => {
  it('abre na etapa de título, com a assinatura e o resumo do scan', () => {
    const { lastFrame } = render(
      <DraftFlow context={context()} onSave={vi.fn()} />,
    );

    const frame = lastFrame();
    // Com a assinatura mais estreita (só "ALEKSANDRIA"), a largura padrão do terminal de teste
    // já comporta a arte ANSI Shadow completa, então o fallback em texto puro não entra em jogo.
    expect(frame).toContain('█████╗');
    expect(frame).toContain('CLAUDE.md');
    expect(frame).toContain('quanthumtech/docs-hub');
    expect(frame).toContain('título do prompt');
    expect(frame).not.toContain('Salvar esse prompt?');
  });
});
