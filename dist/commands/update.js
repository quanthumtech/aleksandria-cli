import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const INSTALL_DIR = path.join(os.homedir(), '.aleksandria-cli');
function run(command, args) {
    const result = spawnSync(command, args, { cwd: INSTALL_DIR, stdio: 'inherit' });
    if (result.status !== 0) {
        throw new Error(`"${command} ${args.join(' ')}" falhou (exit code ${result.status ?? 1}).`);
    }
}
export function runUpdate() {
    if (!fs.existsSync(path.join(INSTALL_DIR, '.git'))) {
        throw new Error(`Não encontrei uma instalação em ${INSTALL_DIR} — rode o instalador de novo:\n` +
            '  curl -fsSL https://raw.githubusercontent.com/quanthumtech/aleksandria-cli/master/install.sh | bash');
    }
    console.log(`→ atualizando ${INSTALL_DIR}...`);
    run('git', ['pull', '--ff-only']);
    console.log('→ instalando dependências...');
    run('npm', ['install']);
    console.log('→ buildando...');
    run('npm', ['run', 'build']);
    console.log('✔ atualizado.');
}
