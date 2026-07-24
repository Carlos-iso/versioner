# Versioner - Checkpoint de Desenvolvimento

## Estado: pronto para publicação (1.0.0 / 1.1.12)

---

## Concluído nesta etapa

- [x] CommandRouter finalizado (mapa nome → classe, aliases, sugestão por Levenshtein)
- [x] BuildCommand / MinorCommand / MajorCommand (via BaseCommand)
- [x] InitCommand completo (detecção de .git, package.json, app.json, app.config.js/ts, prompt de versão inicial, --yes, --force)
- [x] VersionCommand (--json, --raw, --self)
- [x] StatusCommand (versão, arquivos monitorados, configuração, Git)
- [x] HelpCommand (geral e por comando)
- [x] Utils separados: file, object, time, args, logger
- [x] constants/ com metadados de ajuda e defaults
- [x] core/Context.js como fábrica do Context
- [x] Logger revisado (cores ANSI, NO_COLOR, detecção de TTY, field/section/item)
- [x] Configuração com defaults + validação (commit.template, git.*)
- [x] Rollback automático de versão e arquivos quando a release falha
- [x] GitManager com execFileSync (sem shell injection), tag, upstream, status
- [x] Push tolerante a ausência de remoto
- [x] Flags: --no-push, --no-git, --tag, --no-tag, --dry-run
- [x] Bug corrigido: validação de mensagem mínima com texto errado
- [x] Bug corrigido: "Arquivos vercioandos" (typo)
- [x] Bug corrigido: formatDuration com "s" duplicado no log
- [x] README reescrito para o npm
- [x] package.json pronto para publicação (files, engines, repository, bin, main)
- [x] test/smoke.js (16 asserções, roda em repositório Git temporário)
- [x] src/i.js removido (substituído pelos Commands)
- [x] src/Logger.js movido para src/utils/logger.js

---

## Pendente

- [ ] Testar em projetos reais (SocialPet, MommyBee, AdRoad)
- [ ] Publicar no npm
- [ ] CHANGELOG automático
- [ ] Suporte a arquivos não-JSON (regex/replace)
- [ ] Hook de pré-release (rodar testes/lint antes do commit)

---

## Atenção antes de publicar

O nome `versioner` JÁ ESTÁ OCUPADO no npm (pacote existente, v0.9.1).
O package.json está configurado como `@carloscoding/versioner` (escopo livre).
Publicar com:

```bash
npm login
npm test
npm publish --access public
```