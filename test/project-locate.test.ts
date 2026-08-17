import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { locateProjectDir } from '../src/project-locate.js';

describe('locateProjectDir', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'aleksandria-locate-test-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('sem nome, usa o próprio cwd se for um repo git', () => {
    fs.mkdirSync(path.join(root, '.git'));

    expect(locateProjectDir(root)).toBe(root);
  });

  it('sem nome, erra se cwd não for um repo git', () => {
    expect(() => locateProjectDir(root)).toThrow(/nenhum nome de projeto/);
  });

  it('com nome, encontra a subpasta correspondente (case-insensitive)', () => {
    const projectDir = path.join(root, 'docs-hub');
    fs.mkdirSync(path.join(projectDir, '.git'), { recursive: true });

    expect(locateProjectDir(root, 'Docs-Hub')).toBe(projectDir);
  });

  it('erra quando a subpasta não existe', () => {
    expect(() => locateProjectDir(root, 'inexistente')).toThrow(/Não encontrei/);
  });
});
