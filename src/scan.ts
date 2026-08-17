import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface GithubRemote {
  owner: string;
  repo: string;
}

export interface ProjectContext {
  path: string;
  claudeMd: string | null;
  readme: string | null;
  packageDescription: string | null;
  remote: GithubRemote | null;
  recentCommits: string[];
}

const HEAD_CHARS = 2000;

function readHead(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.length > HEAD_CHARS ? content.slice(0, HEAD_CHARS) + '\n…' : content;
}

function readPackageDescription(projectPath: string): string | null {
  for (const [file, pick] of [
    ['package.json', (json: Record<string, unknown>) => [json.name, json.description]],
    ['composer.json', (json: Record<string, unknown>) => [json.name, json.description]],
  ] as const) {
    const full = path.join(projectPath, file);
    if (!fs.existsSync(full)) {
      continue;
    }
    try {
      const json = JSON.parse(fs.readFileSync(full, 'utf-8')) as Record<string, unknown>;
      const [name, description] = pick(json);
      return [name, description].filter(Boolean).join(' — ') || null;
    } catch {
      continue;
    }
  }
  return null;
}

function git(projectPath: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: projectPath, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** Aceita `git@github.com:owner/repo.git` e `https://github.com/owner/repo.git` (com ou sem `.git`). */
export function parseGithubRemote(remoteUrl: string): GithubRemote | null {
  const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+?)(\.git)?$/);
  if (!match) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

export function scanProject(projectPath: string): ProjectContext {
  const remoteUrl = git(projectPath, ['remote', 'get-url', 'origin']);
  const log = git(projectPath, ['log', '-n', '10', '--oneline']);

  return {
    path: projectPath,
    claudeMd: readHead(path.join(projectPath, 'CLAUDE.md')),
    readme: readHead(path.join(projectPath, 'README.md')),
    packageDescription: readPackageDescription(projectPath),
    remote: remoteUrl ? parseGithubRemote(remoteUrl) : null,
    recentCommits: log ? log.split('\n').filter(Boolean) : [],
  };
}
