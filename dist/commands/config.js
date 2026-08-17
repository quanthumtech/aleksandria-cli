import { writeConfig } from '../config.js';
export function runConfigSet(options) {
    if (!options.url && !options.token) {
        throw new Error('Informe --url e/ou --token.');
    }
    const next = writeConfig({
        ...(options.url ? { url: options.url.replace(/\/+$/, '') } : {}),
        ...(options.token ? { token: options.token } : {}),
    });
    if (options.url) {
        console.log(`✔ url: ${next.url}`);
    }
    if (options.token) {
        console.log(`✔ token: ...${next.token?.slice(-4)}`);
    }
}
