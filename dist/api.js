async function request(credentials, path, init = {}) {
    let response;
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
    }
    catch (err) {
        throw new Error(`Não consegui alcançar "${credentials.url}": ${err.message}`);
    }
    if (response.status === 401) {
        throw new Error('Token da Aleksandria inválido ou ausente — rode "aleksandria config set --token <token>".');
    }
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Aleksandria respondeu ${response.status}: ${body}`);
    }
    return response.json();
}
export function resolveProject(credentials, owner, repo) {
    const query = new URLSearchParams({ owner, repo });
    return request(credentials, `/api/projects/resolve?${query}`);
}
export function createPrompt(credentials, input) {
    return request(credentials, '/api/prompts', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}
export function listPrompts(credentials, filters = {}) {
    const query = new URLSearchParams();
    if (filters.project_id)
        query.set('project_id', String(filters.project_id));
    if (filters.status)
        query.set('status', filters.status);
    const suffix = query.toString() ? `?${query}` : '';
    return request(credentials, `/api/prompts${suffix}`);
}
export function getPrompt(credentials, id) {
    return request(credentials, `/api/prompts/${id}`);
}
export function updatePrompt(credentials, id, input) {
    return request(credentials, `/api/prompts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}
