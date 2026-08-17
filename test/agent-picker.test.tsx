import { render } from 'ink-testing-library';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AgentPicker } from '../src/commands/agent-picker.js';
import { AGENTS } from '../src/agents.js';

describe('AgentPicker', () => {
  it('lista todos os agentes e marca o padrão salvo', () => {
    const { lastFrame } = render(
      <AgentPicker agents={AGENTS} defaultId="opencode" onSelect={vi.fn()} />,
    );

    const frame = lastFrame();
    for (const agent of AGENTS) {
      expect(frame).toContain(agent.label);
    }
    expect(frame).toContain('OpenCode (padrão)');
  });

  it('não seleciona nada sozinho', () => {
    const onSelect = vi.fn();
    render(<AgentPicker agents={AGENTS} onSelect={onSelect} />);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
