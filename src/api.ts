import type { Credentials } from './config.js';

export type PromptStatus = 'draft' | 'queued' | 'running' | 'done' | 'failed';

export interface Prompt {
  id: number;
  project_id: number | null;
  title: string;
  body: string;
  status: PromptStatus;
  tags: string[];
  source: 'cli' | 'web';
  context_snapshot: Record<string, unknown> | null;
  executed_at: string | null;
  result_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResolvedProject {
  id: number;
  name: string;
  github_owner: string;
  github_repo: string;
}

async function request<T>(
  credentials: Credentials,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${credentials.url}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init.headers,
      },
    });
  } catch (err) {
    throw new Error(`Não consegui alcançar "${credentials.url}": ${(err as Error).message}`);
  }

  if (response.status === 401) {
    throw new Error('Token da Aleksandria inválido ou ausente — rode "aleksandria config set --token <token>".');
  }
  if (response.status === 404) {
    return null as T;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Aleksandria respondeu ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export function resolveProject(
  credentials: Credentials,
  owner: string,
  repo: string,
): Promise<ResolvedProject | null> {
  const query = new URLSearchParams({ owner, repo });
  return request<ResolvedProject | null>(credentials, `/api/projects/resolve?${query}`);
}

export interface CreatePromptInput {
  project_id: number | null;
  title: string;
  body: string;
  source: 'cli';
  context_snapshot?: Record<string, unknown>;
}

export function createPrompt(credentials: Credentials, input: CreatePromptInput): Promise<Prompt> {
  return request<Prompt>(credentials, '/api/prompts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listPrompts(
  credentials: Credentials,
  filters: { project_id?: number; status?: PromptStatus } = {},
): Promise<Prompt[]> {
  const query = new URLSearchParams();
  if (filters.project_id) query.set('project_id', String(filters.project_id));
  if (filters.status) query.set('status', filters.status);
  const suffix = query.toString() ? `?${query}` : '';
  return request<Prompt[]>(credentials, `/api/prompts${suffix}`);
}

export function getPrompt(credentials: Credentials, id: number): Promise<Prompt | null> {
  return request<Prompt | null>(credentials, `/api/prompts/${id}`);
}

export interface UpdatePromptInput {
  status?: PromptStatus;
  result_notes?: string;
  executed_at?: string;
}

export function updatePrompt(
  credentials: Credentials,
  id: number,
  input: UpdatePromptInput,
): Promise<Prompt> {
  return request<Prompt>(credentials, `/api/prompts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
