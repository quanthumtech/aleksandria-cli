# aleksandria-cli

CLI da Aleksandria: escreve prompts com o contexto real de cada projeto local
(`CLAUDE.md`, README, git log) e guarda tudo na Aleksandria, pronto pra
executar depois com o `claude`.

Não publicado no npm — uso local via `npm link`, no mesmo espírito do
`quanthum-cli`.

## Instalação

```bash
cd aleksandria-cli
npm install
npm run build
npm link        # expõe o comando `aleksandria` globalmente
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
