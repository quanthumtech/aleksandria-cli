import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCredentials, readConfig, writeConfig } from '../src/config.js';

describe('config', () => {
  let fakeHome: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'aleksandria-config-test-'));
    vi.spyOn(os, 'homedir').mockReturnValue(fakeHome);
    delete process.env.ALEKSANDRIA_URL;
    delete process.env.ALEKSANDRIA_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(fakeHome, { recursive: true, force: true });
    process.env = { ...originalEnv };
  });

  it('readConfig devolve objeto vazio quando o arquivo não existe', () => {
    expect(readConfig()).toEqual({});
  });

  it('writeConfig persiste e faz merge com o que já existia', () => {
    writeConfig({ url: 'https://aleksandria.test' });
    writeConfig({ token: 'abc' });

    expect(readConfig()).toEqual({ url: 'https://aleksandria.test', token: 'abc' });
  });

  it('getCredentials usa env var quando presente, sobrepondo o arquivo', () => {
    writeConfig({ url: 'https://arquivo.test', token: 'do-arquivo' });
    process.env.ALEKSANDRIA_TOKEN = 'da-env';

    expect(getCredentials()).toEqual({ url: 'https://arquivo.test', token: 'da-env' });
  });

  it('getCredentials lança erro claro quando não há url/token', () => {
    expect(() => getCredentials()).toThrow(/config set/);
  });
});
