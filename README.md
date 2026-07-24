# Versioner

CLI que substitui o fluxo manual de release por um único comando.

Antes:

```bash
# edita package.json
# edita app.json
git add .
git commit -m "v1.4.273 - Corrige login"
git push
```

Depois:

```bash
versioner build "Corrige login"
```

Sem dependências externas. Só Node.js e Git.

---

## Instalação

No projeto:

```bash
npm install -D @carloscoding/versioner
```

Sem instalar:

```bash
npx @carloscoding/versioner init
```

Global:

```bash
npm install -g @carloscoding/versioner
```

Requer Node.js 16 ou superior.

---

## Início rápido

```bash
cd meu-projeto
npx @carloscoding/versioner init
npx versioner build "primeira release"
```

O `init` cria dois arquivos, detecta o `package.json` e o `app.json`, e pergunta a versão inicial.

Se estiver usando como dependência do projeto, adicione atalhos no `package.json`:

```json
{
    "scripts": {
        "build": "versioner build",
        "minor": "versioner minor",
        "major": "versioner major"
    }
}
```

E use:

```bash
npm run build -- "Corrige login"
```

---

## Modelo de versionamento

Formato:

```
major.minor.build
```

Exemplo: `2.14.583`

### Build

Incrementa em **toda** release e **nunca** volta para zero. Representa o total de releases já publicadas.

```
2.14.583 → 2.14.584 → 2.14.585
```

### Minor

Pequenas evoluções dentro de uma mesma versão principal. Zera quando ocorre um Major.

```
2.14.583 → 2.15.584
```

### Major

Grandes marcos: primeira versão pública, reescrita, nova arquitetura. Definido manualmente.

```
2.14.583 → 3.0.584
```

O Build continua incrementando normalmente mesmo em um Major.

### Por que não SemVer

O SemVer descreve compatibilidade de API. Este modelo descreve o **histórico do projeto**: quantas grandes versões existiram, quantas evoluções cada uma recebeu e quantas releases foram publicadas desde o início.

O formato continua compatível com `x.y.z`, então o `package.json` permanece válido.

---

## Comandos

| Comando | O que faz |
|---|---|
| `versioner init` | Inicializa o Versioner no projeto |
| `versioner build "msg"` | Incrementa a Build e publica a release |
| `versioner minor "msg"` | Incrementa Minor e Build |
| `versioner major "msg"` | Incrementa Major, zera Minor, incrementa Build |
| `versioner version` | Mostra a versão atual |
| `versioner status` | Mostra versão, arquivos monitorados e estado do Git |
| `versioner help [comando]` | Ajuda |

Aliases: `b`, `m`, `M`, `i`, `v`, `s`, `h`.

### Flags de release

| Flag | Efeito |
|---|---|
| `--no-push` | Faz commit mas não envia para o remoto |
| `--no-git` | Só versiona os arquivos, não toca no Git |
| `--tag` | Cria uma tag Git para a release |
| `--no-tag` | Desativa a tag mesmo se ligada na config |
| `--dry-run` | Simula tudo sem gravar nada |

### Flags do init

| Flag | Efeito |
|---|---|
| `--yes`, `-y` | Usa os padrões sem perguntar |
| `--force`, `-f` | Sobrescreve arquivos existentes |

---

## Arquivos gerados

### `.versioner.json`

O contador de versão do projeto.

```json
{
    "major": 1,
    "minor": 4,
    "build": 273
}
```

### `versioner.config.json`

Define o comportamento e quais arquivos recebem a versão.

```json
{
    "versionFile": ".versioner.json",
    "files": [
        {
            "path": "package.json",
            "field": "version"
        },
        {
            "path": "app.json",
            "field": "expo.version"
        }
    ],
    "commit": {
        "template": "v{version} - {message}",
        "minLength": 3,
        "maxLength": 100
    },
    "git": {
        "enabled": true,
        "add": true,
        "commit": true,
        "push": true,
        "tag": false,
        "tagPrefix": "v",
        "tagMessage": "Release {version}"
    }
}
```

**`files`** — qualquer arquivo `.json`. O campo `field` aceita caminhos aninhados:

```
version
expo.version
project.meta.version
```

**`commit.template`** — aceita `{version}`, `{message}` e `{type}`.

Arquivos de código (`app.config.js`, `app.config.ts`) são detectados pelo `init` mas **não** são alterados automaticamente. Nesses casos, leia a versão do JSON:

```js
const { version } = require("./package.json");

export default {
    expo: { version },
};
```

---

## Segurança da release

Se qualquer etapa falhar no meio do caminho, o Versioner reverte o arquivo de versão e todos os arquivos alterados. Nada fica commitado pela metade.

O `push` é ignorado com um aviso quando não existe remoto configurado, em vez de derrubar a release. Se a branch ainda não tiver upstream, o Versioner usa `--set-upstream origin <branch>` automaticamente.

Mensagens de commit são passadas por `execFile` com array de argumentos, então aspas, `$` e crases não quebram nem executam nada.

---

## Uso programático

```js
const { ReleaseManager, createContext } = require("@carloscoding/versioner");

const context = createContext({ type: "build", message: "Release automática" });

new ReleaseManager().run(context);
```

Também são exportados `VersionManager`, `ConfigManager`, `FileManager`, `GitManager`, `CommandRouter`, `logger` e `constants`.

---

## Arquitetura

```
bin/versioner.js         Binário da CLI (shebang)
src/cli.js               Bootstrap da CLI e tratamento de erro
src/index.js             Entrada programática (require do pacote)
src/services/            CommandRouter (mapa nome → classe)
src/commands/            Um arquivo por comando
src/managers/            Release, Version, Config, File, Git
src/core/Context.js      Objeto compartilhado da execução
src/utils/               file, object, time, args, logger
src/constants/           Valores fixos e metadados de ajuda
```

Regra central: nenhum Manager conhece outro Manager. Todos leem e escrevem apenas no `Context`. O `ReleaseManager` só orquestra a sequência:

```
validate → loadConfig → version → updateFiles → git → finish
```

---

## Desenvolvimento

```bash
npm test    # teste de fumaça em um repositório Git temporário
```

Para logs completos de erro:

```bash
VERSIONER_DEBUG=1 versioner build "teste"
```

Cores são desativadas automaticamente com `NO_COLOR=1` ou fora de um TTY.

---

## Licença

MIT.