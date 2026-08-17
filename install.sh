#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/quanthumtech/aleksandria-cli.git"
DEST="$HOME/.aleksandria-cli"

if [ -d "$DEST/.git" ]; then
  echo "→ atualizando $DEST..."
  git -C "$DEST" pull --ff-only
else
  echo "→ clonando em $DEST..."
  git clone "$REPO" "$DEST"
fi

cd "$DEST"
echo "→ instalando dependências..."
npm install
echo "→ buildando..."
npm run build
echo "→ linkando o comando aleksandria..."
npm link

echo "✔ pronto — roda \"aleksandria draft <projeto>\" pra começar."
