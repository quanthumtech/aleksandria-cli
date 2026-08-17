import { Box, render, Text, useInput } from 'ink';
import { useState } from 'react';
import type { AgentOption } from '../agents.js';

export function AgentPicker({
  agents,
  defaultId,
  onSelect,
}: {
  agents: AgentOption[];
  defaultId?: string;
  onSelect: (agent: AgentOption) => void;
}) {
  const startIndex = Math.max(
    0,
    agents.findIndex((agent) => agent.id === defaultId),
  );
  const [index, setIndex] = useState(startIndex);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setIndex((i) => (i - 1 + agents.length) % agents.length);
    } else if (key.downArrow || input === 'j') {
      setIndex((i) => (i + 1) % agents.length);
    } else if (key.return) {
      onSelect(agents[index]);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1}>
      <Text color="gray"># executar prompt com</Text>
      {agents.map((agent, i) => (
        <Text key={agent.id} color={i === index ? 'magenta' : undefined}>
          {i === index ? '❯ ' : '  '}
          {agent.label}
          {agent.id === defaultId ? ' (padrão)' : ''}
        </Text>
      ))}
      <Text color="gray">[↑/↓] navegar   [enter] selecionar</Text>
    </Box>
  );
}

/**
 * A escolha vira o novo padrão salvo em ~/.config/aleksandria — quem quiser pular a lista
 * de novo usa "--agent <id>".
 */
export async function pickAgent(agents: AgentOption[], defaultId?: string): Promise<AgentOption> {
  return new Promise((resolve) => {
    const { unmount } = render(
      <AgentPicker
        agents={agents}
        defaultId={defaultId}
        onSelect={(agent) => {
          unmount();
          resolve(agent);
        }}
      />,
    );
  });
}
