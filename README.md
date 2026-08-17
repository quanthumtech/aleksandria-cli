# aleksandria-cli

CLI da Aleksandria: escreve prompts com o contexto real de cada projeto local
(`CLAUDE.md`, README, git log) e guarda tudo na Aleksandria, pronto pra
executar depois com o `claude`.

Não publicado no npm. `npm install -g git+https://...` quebra nesta versão
do npm (10.8.2) — o passo final de instalação global de uma dependência git
faz um `rename()` de um symlink que aponta pro cache temporário do npm,
o que falha com `ENOTDIR` (reproduzido de forma consistente, inclusive com
cache limpo e commit fixado — não é um problema de cache). `npx
github:...` funciona, mas exige repetir o prefixo (ou um alias) toda vez.

## Instalação

Um comando só — clona pra uma pasta fixa e deixa o `aleksandria` pronto:

```bash
git clone https://github.com/quanthumtech/aleksandria-cli.git ~/.aleksandria-cli \
  && cd ~/.aleksandria-cli && npm install && npm run build && npm link
```

Pra atualizar depois:

```bash
cd ~/.aleksandria-cli && git pull && npm install && npm run build
```

## Configuração

```bash
aleksandria config set --url https://aleksandria.quanthum.tec.br
aleksandria config set --token <token>   # Settings › Prompts (API) na Aleksandria
```

Fica em `~/.config/aleksandria/config.json`. Variáveis de ambiente
`ALEKSANDRIA_URL`/`ALEKSANDRIA_TOKEN` sempre sobrepõem o arquivo.

## Uso

A partir de dentro (ou uma pasta acima) do projeto:

```bash
aleksandria draft docs-hub
```

Escaneia o projeto (`CLAUDE.md`, `README.md`, `package.json`/`composer.json`,
`git remote`, `git log -10`), pede a descrição da feature numa tela com
assinatura (Ink), monta um draft local combinando contexto + descrição
(sem IA), abre `$EDITOR` pra revisão e salva na Aleksandria.

```bash
aleksandria list --project <id> --status draft
aleksandria run <id>
```

`run` resolve a pasta local do projeto (guardada em cache desde o último
`draft` rodado ali, ou via `--path <pasta>`), dispara `claude` com o corpo
do prompt, e reporta o resultado de volta pra Aleksandria.

## Testes

```bash
npm test
```

Sem rede real — testes de scan usam repositórios git descartáveis em
`os.tmpdir()`, e o cliente de API mocka `fetch`.

## O que este CLI NÃO faz (v1)

- Não chama nenhuma IA pra melhorar o draft — é template local, revisado
  manualmente no `$EDITOR`.
- `list`/`run` são comandos de linha de comando simples — só o `draft`
  usa a tela interativa (Ink).
