import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseGithubRemote, scanProject } from '../src/scan.js';

function git(dir: string, args: string[]): void {
  execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
}

describe('parseGithubRemote', () => {
  it('aceita URL https com .git', () => {
    expect(parseGithubRemote('https://github.com/quanthumtech/docs-hub.git')).toEqual({
      owner: 'quanthumtech',
      repo: 'docs-hub',
    });
  });

  it('aceita URL https sem .git', () => {
    expect(parseGithubRemote('https://github.com/quanthumtech/docs-hub')).toEqual({
      owner: 'quanthumtech',
      repo: 'docs-hub',
    });
  });

  it('aceita URL ssh', () => {
    expect(parseGithubRemote('git@github.com:quanthumtech/docs-hub.git')).toEqual({
      owner: 'quanthumtech',
      repo: 'docs-hub',
    });
  });

  it('devolve null pra remotes que não são do github', () => {
    expect(parseGithubRemote('https://gitlab.com/foo/bar.git')).toBeNull();
  });
});

describe('scanProject', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aleksandria-scan-test-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('lê CLAUDE.md, README.md, package.json e o git log/remote', () => {
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# Regras do projeto');
    fs.writeFileSync(path.join(dir, 'README.md'), '# Meu Projeto');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'meu-projeto', description: 'Um teste' }));

    git(dir, ['init']);
    git(dir, ['config', 'user.email', 'test@example.com']);
    git(dir, ['config', 'user.name', 'Test']);
    git(dir, ['remote', 'add', 'origin', 'https://github.com/quanthumtech/meu-projeto.git']);
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-m', 'inicial']);

    const context = scanProject(dir);

    expect(context.claudeMd).toContain('Regras do projeto');
    expect(context.readme).toContain('Meu Projeto');
    expect(context.packageDescription).toBe('meu-projeto — Um teste');
    expect(context.remote).toEqual({ owner: 'quanthumtech', repo: 'meu-projeto' });
    expect(context.recentCommits).toHaveLength(1);
    expect(context.recentCommits[0]).toContain('inicial');
  });

  it('não quebra quando não há git, CLAUDE.md ou README', () => {
    const context = scanProject(dir);

    expect(context.claudeMd).toBeNull();
    expect(context.readme).toBeNull();
    expect(context.packageDescription).toBeNull();
    expect(context.remote).toBeNull();
    expect(context.recentCommits).toEqual([]);
  });
});
