# Versioner

Um script simples para automatizar o versionamento de projetos utilizando um modelo próprio de versionamento baseado em marcos do projeto.

## Objetivo

O objetivo deste projeto é facilitar o gerenciamento de versões durante o desenvolvimento.

Em vez de atualizar manualmente os números de versão a cada alteração, o script realiza essa tarefa automaticamente e pode ser integrado ao fluxo de Git (`git add`, `git commit` e `git push`).

O foco inicial é ser utilizado através de scripts do `package.json`, sem dependências externas e sem necessidade de instalação como biblioteca.

---

# Modelo de Versionamento

O projeto utiliza o formato:

```
vX.Y.Z
```

Onde:

## X - Major

Representa um grande marco do projeto.

Exemplos:

* Primeiro lançamento oficial
* Grande reformulação
* Nova arquitetura
* Reescrita completa
* Mudança significativa de funcionalidades

Este valor **não é incrementado automaticamente**.

Quando incrementado:

* X++
* Y = 0
* Z++

Exemplo:

```
v1.14.258

↓

v2.0.259
```

---

## Y - Minor

Representa pequenas evoluções dentro da mesma versão principal.

Exemplos:

* Nova funcionalidade
* Melhorias
* Ajustes importantes
* Recursos adicionais

Quando incrementado:

* Y++
* Z++

Exemplo:

```
v2.14.583

↓

v2.15.584
```

---

## Z - Build

Representa cada publicação do projeto.

Toda vez que houver um novo commit/release utilizando o script, este número é incrementado.

O contador **nunca é reiniciado**.

Exemplo:

```
v2.15.584

↓

v2.15.585

↓

v2.15.586
```

Mesmo quando ocorre uma nova versão Major.

```
v2.18.612

↓

v3.0.613
```

---

# Filosofia

Este sistema é baseado em marcos do desenvolvimento.

A versão Major representa grandes acontecimentos do projeto.

A versão Minor representa a evolução daquela grande versão.

A Build representa o histórico completo de todas as publicações realizadas.

Isso permite identificar rapidamente:

* Quantas grandes versões o projeto teve.
* Quantas atualizações cada versão recebeu.
* Quantas builds já foram publicadas desde o início do projeto.

---

# Estrutura

```
version.json
```

Exemplo:

```json
{
    "major": 2,
    "minor": 14,
    "build": 583
}
```

---

# Comandos

## Build

Incrementa apenas a Build.

```
2.14.583

↓

2.14.584
```

---

## Minor

Incrementa Minor e Build.

```
2.14.583

↓

2.15.584
```

---

## Major

Incrementa Major, reinicia Minor e incrementa Build.

```
2.14.583

↓

3.0.584
```

---

# Objetivos futuros

O projeto foi pensado para crescer gradualmente.

Planejamento:

* Atualização automática do `package.json`.
* Atualização automática do `app.json` (Expo).
* Atualização de arquivos personalizados.
* Criação automática de tags Git.
* Geração automática de CHANGELOG.
* Publicação automática.
* Transformação em uma CLI.
* Publicação como pacote npm.

---

# Licença

MIT.
