import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrompt, listPrompts, resolveProject, updatePrompt } from '../src/api.js';

const credentials = { url: 'https://aleksandria.test', token: 'secret-token' };

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolveProject devolve null em 404', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 404, ok: false });

    const result = await resolveProject(credentials, 'quanthumtech', 'ghost');

    expect(result).toBeNull();
  });

  it('resolveProject manda Authorization e query certos', async () => {
    const mock = fetch as unknown as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ id: 1, name: 'docs-hub', github_owner: 'quanthumtech', github_repo: 'docs-hub' }),
    });

    await resolveProject(credentials, 'quanthumtech', 'docs-hub');

    const [url, init] = mock.mock.calls[0];
    expect(url).toBe('https://aleksandria.test/api/projects/resolve?owner=quanthumtech&repo=docs-hub');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-token');
  });

  it('lança erro claro em 401', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 401, ok: false });

    await expect(listPrompts(credentials)).rejects.toThrow(/Token da Aleksandria/);
  });

  it('lança erro em status de falha genérico', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
      ok: false,
      text: async () => 'boom',
    });

    await expect(listPrompts(credentials)).rejects.toThrow(/500/);
  });

  it('createPrompt faz POST com o corpo serializado', async () => {
    const mock = fetch as unknown as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ id: 5, status: 'draft' }),
    });

    await createPrompt(credentials, {
      project_id: 1,
      title: 'Teste',
      body: 'corpo',
      source: 'cli',
    });

    const [, init] = mock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({ title: 'Teste', body: 'corpo' });
  });

  it('updatePrompt faz PATCH', async () => {
    const mock = fetch as unknown as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ id: 5, status: 'done' }) });

    await updatePrompt(credentials, 5, { status: 'done' });

    const [url, init] = mock.mock.calls[0];
    expect(url).toBe('https://aleksandria.test/api/prompts/5');
    expect(init.method).toBe('PATCH');
  });
});
