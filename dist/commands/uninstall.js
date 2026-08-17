import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { configDir } from '../config.js';
const INSTALL_DIR = path.join(os.homedir(), '.aleksandria-cli');
export function runUninstall(options = {}) {
    console.log('→ desvinculando o comando aleksandria...');
    spawnSync('npm', ['rm', '-g', 'aleksandria-cli'], { stdio: 'inherit' });
    if (fs.existsSync(INSTALL_DIR)) {
        console.log(`→ removendo ${INSTALL_DIR}...`);
        // Seguro apagar a pasta de onde este próprio processo está rodando — no Linux o arquivo
        // continua aberto pelo processo atual até ele terminar, só o link no diretório some.
        fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
    }
    if (options.purgeConfig) {
        const dir = configDir();
        if (fs.existsSync(dir)) {
            console.log(`→ removendo ${dir}...`);
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
    else {
        console.log(`ℹ config/token mantidos em ${configDir()} — rode com --purge-config pra remover também.`);
    }
    console.log('✔ desinstalado.');
}
