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

Sem instalar:

```bash
npx @carlos-iso/versioner init
```

Global:

```bash
npm install -g @carlos-iso/versioner
```

Requer Node.js 18 ou superior.

---

## Início rápido

```bash
cd meu-projeto
npx @carlos-iso/versioner init
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

### Por que não SemVer (padrão)

O SemVer descreve compatibilidade de API. Este modelo descreve o **histórico do projeto**: quantas grandes versões existiram, quantas evoluções cada uma recebeu e quantas releases foram publicadas desde o início.

O formato continua compatível com `x.y.z`, então o `package.json` permanece válido.

Se preferir o comportamento SemVer, ative `semver: true` no `versioner.config.json` — veja a seção [SemVer](#semver).

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
| `versioner pull` | Atualiza o repositório local com as mudanças do remoto |
| `versioner merge <branch>` | Faz merge de um branch no branch atual |
| `versioner help [comando]` | Ajuda |

Aliases: `b`, `m`, `M`, `i`, `v`, `s`, `p`, `h`.

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

### Flags do pull

| Flag | Efeito |
|---|---|
| `--merge` | Usa merge em vez de rebase (padrão é rebase) |

---

## SemVer

Para projetos que seguem o [Versionamento Semântico](https://semver.org/), ative o modo SemVer no `versioner.config.json`:

```json
{
    "semver": true
}
```

Com `semver: true`, o comportamento de cada comando muda:

| Versão atual | Comando | Resultado |
|---|---|---|
| `1.2.5` | `build` | `1.2.6` (patch++) |
| `1.2.5` | `minor` | `1.3.0` (minor++, patch vira 0) |
| `1.2.5` | `major` | `2.0.0` (major++, minor e patch viram 0) |

Comparação com o comportamento padrão (sem SemVer):

| Versão atual | Comando | Padrão | SemVer |
|---|---|---|---|
| `1.2.5` | `minor` | `1.3.6` | `1.3.0` |
| `1.2.5` | `major` | `2.0.6` | `2.0.0` |

No padrão, o `build` é um contador global que nunca zera — ele representa o total de releases já feitas. No SemVer, o `patch` reinicia a cada `minor` ou `major`, seguindo a convenção da comunidade.

---

## Add por arquivo

Por padrão, o Versioner executa `git add .` antes de cada commit, incluindo todas as mudanças do repositório. Para controlar quais arquivos entram no commit, configure `addAll: false`:

```json
{
    "git": {
        "addAll": false
    }
}
```

Com `addAll: false`, a sintaxe muda: o primeiro argumento é a lista de arquivos (separados por espaço), e o segundo é a mensagem do commit.

```bash
versioner build "src/login.js" "Corrige autenticação"
versioner minor "src/auth.js src/session.js" "Adiciona refresh token"
```

Os arquivos de versão (`.versioner.json`, `package.json` etc.) são sempre incluídos automaticamente, independente do que você especificar. Arquivos não listados permanecem no working tree sem serem commitados.

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
        "addAll": true,
        "commit": true,
        "push": true,
        "tag": false,
        "tagPrefix": "v",
        "tagMessage": "Release {version}"
    },
    "semver": false
}
```

**`files`** — qualquer arquivo `.json`. O campo `field` aceita caminhos aninhados:

```
version
expo.version
project.meta.version
```

**`commit.template`** — aceita `{version}`, `{message}` e `{type}`.

**`git.addAll`** — `true` faz `git add .` (padrão); `false` exige que os arquivos sejam listados no comando.

**`semver`** — `false` usa o modelo de build global (padrão); `true` segue o padrão SemVer com resets.

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
npm test    # 42 asserções em um repositório Git temporário
```

Para logs completos de erro:

```bash
VERSIONER_DEBUG=1 versioner build "teste"
```

Cores são desativadas automaticamente com `NO_COLOR=1` ou fora de um TTY.

---

## Licença

MIT.
