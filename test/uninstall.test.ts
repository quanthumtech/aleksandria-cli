import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

describe('runUninstall', () => {
  let fakeHome: string;

  beforeEach(() => {
    vi.resetModules();
    fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'aleksandria-uninstall-test-'));
    vi.spyOn(os, 'homedir').mockReturnValue(fakeHome);
    fs.mkdirSync(path.join(fakeHome, '.aleksandria-cli'), { recursive: true });
    fs.mkdirSync(path.join(fakeHome, '.config', 'aleksandria'), { recursive: true });
    fs.writeFileSync(path.join(fakeHome, '.config', 'aleksandria', 'config.json'), '{}');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(fakeHome, { recursive: true, force: true });
  });

  it('remove ~/.aleksandria-cli e desvincula o comando global, mas mantém o config por padrão', async () => {
    const { spawnSync } = await import('node:child_process');
    const { runUninstall } = await import('../src/commands/uninstall.js');

    runUninstall();

    expect(spawnSync).toHaveBeenCalledWith('npm', ['rm', '-g', 'aleksandria-cli'], expect.any(Object));
    expect(fs.existsSync(path.join(fakeHome, '.aleksandria-cli'))).toBe(false);
    expect(fs.existsSync(path.join(fakeHome, '.config', 'aleksandria', 'config.json'))).toBe(true);
  });

  it('também remove o config quando --purge-config é passado', async () => {
    const { runUninstall } = await import('../src/commands/uninstall.js');

    runUninstall({ purgeConfig: true });

    expect(fs.existsSync(path.join(fakeHome, '.config', 'aleksandria'))).toBe(false);
  });
});
