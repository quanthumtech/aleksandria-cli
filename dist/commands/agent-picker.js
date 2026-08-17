import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, render, Text, useInput } from 'ink';
import { useState } from 'react';
export function AgentPicker({ agents, defaultId, onSelect, }) {
    const startIndex = Math.max(0, agents.findIndex((agent) => agent.id === defaultId));
    const [index, setIndex] = useState(startIndex);
    useInput((input, key) => {
        if (key.upArrow || input === 'k') {
            setIndex((i) => (i - 1 + agents.length) % agents.length);
        }
        else if (key.downArrow || input === 'j') {
            setIndex((i) => (i + 1) % agents.length);
        }
        else if (key.return) {
            onSelect(agents[index]);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 1, children: [_jsx(Text, { color: "gray", children: "# executar prompt com" }), agents.map((agent, i) => (_jsxs(Text, { color: i === index ? 'magenta' : undefined, children: [i === index ? '❯ ' : '  ', agent.label, agent.id === defaultId ? ' (padrão)' : ''] }, agent.id))), _jsx(Text, { color: "gray", children: "[\u2191/\u2193] navegar   [enter] selecionar" })] }));
}
/**
 * A escolha vira o novo padrão salvo em ~/.config/aleksandria — quem quiser pular a lista
 * de novo usa "--agent <id>".
 */
export async function pickAgent(agents, defaultId) {
    return new Promise((resolve) => {
        const { unmount } = render(_jsx(AgentPicker, { agents: agents, defaultId: defaultId, onSelect: (agent) => {
                unmount();
                resolve(agent);
            } }));
    });
}
