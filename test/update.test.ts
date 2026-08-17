import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

describe('runUpdate', () => {
  let fakeHome: string;

  beforeEach(() => {
    vi.resetModules();
    fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'aleksandria-update-test-'));
    vi.spyOn(os, 'homedir').mockReturnValue(fakeHome);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(fakeHome, { recursive: true, force: true });
  });

  it('erra com instruções quando ~/.aleksandria-cli não existe', async () => {
    const { runUpdate } = await import('../src/commands/update.js');

    expect(() => runUpdate()).toThrow(/install\.sh/);
  });

  it('roda git pull, npm install e npm run build quando a instalação existe', async () => {
    fs.mkdirSync(path.join(fakeHome, '.aleksandria-cli', '.git'), { recursive: true });
    const { spawnSync } = await import('node:child_process');
    const { runUpdate } = await import('../src/commands/update.js');

    runUpdate();

    const calls = (spawnSync as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('git');
    expect(calls[0][1]).toEqual(['pull', '--ff-only']);
    expect(calls[1]).toEqual(['npm', ['install'], expect.any(Object)]);
    expect(calls[2]).toEqual(['npm', ['run', 'build'], expect.any(Object)]);
  });
});
