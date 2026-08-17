import fs from 'node:fs';
import path from 'node:path';
function hasGit(dir) {
    return fs.existsSync(path.join(dir, '.git'));
}
/**
 * Sem nome: usa o próprio cwd, se for um repo git.
 * Com nome: procura uma subpasta de cwd com esse nome (case-insensitive) que seja um repo git.
 */
export function locateProjectDir(cwd, name) {
    if (!name) {
        if (hasGit(cwd)) {
            return cwd;
        }
        throw new Error(`"${cwd}" não é um repositório git e nenhum nome de projeto foi informado — rode de dentro do projeto ou passe "aleksandria draft <projeto>".`);
    }
    const direct = path.join(cwd, name);
    if (hasGit(direct)) {
        return direct;
    }
    const entries = fs.readdirSync(cwd, { withFileTypes: true }).filter((e) => e.isDirectory());
    const match = entries.find((e) => e.name.toLowerCase() === name.toLowerCase() && hasGit(path.join(cwd, e.name)));
    if (match) {
        return path.join(cwd, match.name);
    }
    throw new Error(`Não encontrei um repositório "${name}" em subpastas de "${cwd}".`);
}
