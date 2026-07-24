const VersionManager = require("./VersionManager");
const ConfigManager = require("./ConfigManager");
const FileManager = require("./FileManager");
const GitManager = require("./GitManager");

const logger = require("../utils/logger");
const { formatDuration } = require("../utils/time");
const { hasFlag } = require("../utils/args");
const { VERSION_TYPES } = require("../constants");

/**
 * Orquestra o fluxo de release.
 * Nenhuma regra de negócio fica no run(): apenas a sequência de etapas.
 */
class ReleaseManager {
	constructor(cwd = process.cwd()) {
		this.cwd = cwd;

		this.configManager = new ConfigManager(cwd);
		this.fileManager = new FileManager(cwd);
		this.gitManager = new GitManager(cwd);

		// Criado em loadConfig(), pois depende de config.versionFile.
		this.versionManager = null;
	}

	async run(context) {
		try {
			logger.title(`Versioner · ${context.type}`);

			this.validate(context);
			this.loadConfig(context);
			this.version(context);
			this.updateFiles(context);
			this.git(context);
			this.finish(context);

			return 0;
		} catch (error) {
			this.rollback(context, error);

			return 1;
		}
	}

	// ── Etapas ────────────────────────────────────────────────

	validate(context) {
		if (!VERSION_TYPES.includes(context.type)) {
			throw new Error("Tipo de release inválido. Utilize: build, minor ou major.");
		}

		context.dryRun = hasFlag(context.flags, "dry-run");

		if (!this.gitManager.isInstalled()) {
			throw new Error("Git não encontrado no sistema.");
		}

		if (this.useGit(context) && !this.gitManager.isRepository()) {
			throw new Error(
				'Este diretório não é um repositório Git. Use "git init" ou rode com --no-git.',
			);
		}
	}

	loadConfig(context) {
		context.config = this.configManager.load();

		this.versionManager = new VersionManager(this.cwd, context.config.versionFile);

		this.validateMessage(context);

		logger.success("Configuração carregada.");
	}

	validateMessage(context) {
		const { minLength, maxLength } = context.config.commit;

		const message = String(context.message || "").trim();

		if (!message) {
			throw new Error(
				`Informe uma mensagem para o commit. Exemplo: versioner ${context.type} "Corrige login"`,
			);
		}

		if (message.length < minLength) {
			throw new Error(
				`A mensagem do commit deve ter no mínimo ${minLength} caracteres.`,
			);
		}

		if (message.length > maxLength) {
			throw new Error(
				`A mensagem do commit deve ter no máximo ${maxLength} caracteres.`,
			);
		}

		context.message = message;
	}

	version(context) {
		const result = this.versionManager.increment(context.type, {
			dryRun: context.dryRun,
		});

		context.previous = result.previous;
		context.current = result.current;
		context.previousVersion = result.previousVersion;
		context.version = result.version;

		logger.success(`Versão ${context.previousVersion} → ${logger.bold(context.version)}`);

		logger.info(`Mensagem: ${context.message}`);
	}

	updateFiles(context) {
		const files = context.config.files;

		if (!files.length) {
			logger.warn("Nenhum arquivo monitorado na configuração.");
			return;
		}

		logger.info("Atualizando arquivos...");

		for (const file of files) {
			const result = this.fileManager.update(file, context.version, {
				dryRun: context.dryRun,
			});

			if (!result.updated) {
				context.skipped.push({ path: file.path, reason: result.reason });

				logger.muted(`  ${file.path} ignorado (${result.reason})`);
				continue;
			}

			context.files.push(file.path);

			logger.success(`  ${file.path} → ${file.field}`);
		}
	}

	git(context) {
		if (!this.useGit(context)) {
			logger.warn("Etapa do Git ignorada.");
			return;
		}

		const git = context.config.git;

		logger.info("Executando Git...");

		context.git.branch = this.gitManager.branch();

		if (context.dryRun) {
			logger.muted("  dry-run: nenhum comando Git foi executado.");
			return;
		}

		if (git.add) {
			this.gitManager.add();
			context.git.add = true;
			logger.success("  git add");
		}

		if (git.commit) {
			const message = this.buildCommitMessage(context);

			this.gitManager.commit(message);
			context.git.commit = true;
			logger.success(`  git commit -m "${message}"`);
		}

		if (this.shouldTag(context)) {
			const name = `${git.tagPrefix}${context.version}`;
			const message = git.tagMessage.replace("{version}", context.version);

			const result = this.gitManager.tag(name, message);

			context.git.tag = result.success;
			context.git.tagName = result.success ? name : null;

			if (result.success) {
				logger.success(`  git tag ${name}`);
			} else {
				logger.warn(`  tag ignorada (${result.reason})`);
			}
		}

		if (this.shouldPush(context)) {
			const result = this.gitManager.push();

			context.git.push = result.success;

			if (result.success) {
				logger.success("  git push");
			} else {
				logger.warn(`  push ignorado (${result.reason})`);
			}

			if (context.git.tag && result.success) {
				this.gitManager.pushTags();
				logger.success("  git push --tags");
			}
		}
	}

	finish(context) {
		context.finishedAt = new Date();

		const duration = context.finishedAt - context.startedAt;

		this.fileManager.clearBackups();

		logger.title(context.dryRun ? "Simulação concluída" : "Release concluída");

		logger.field("Versão", `${context.previousVersion} → ${context.version}`);
		logger.field("Arquivos", String(context.files.length));

		if (context.git.branch) {
			logger.field("Branch", context.git.branch);
		}

		logger.field("Git add", this.mark(context.git.add));
		logger.field("Git commit", this.mark(context.git.commit));
		logger.field("Git push", this.mark(context.git.push));

		if (context.git.tagName) {
			logger.field("Tag", context.git.tagName);
		}

		logger.field("Tempo", formatDuration(duration));

		logger.break();
	}

	// ── Suporte ───────────────────────────────────────────────

	rollback(context, error) {
		logger.break();
		logger.error(error.message);

		const restoredFiles = this.fileManager.rollback();

		const restoredVersion =
			!context.dryRun && this.versionManager && context.previous?.build !== null
				? this.versionManager.rollback(context.previous)
				: false;

		if (restoredFiles || restoredVersion) {
			logger.warn("Alterações revertidas. Nada foi commitado.");
		}

		if (process.env.VERSIONER_DEBUG) {
			console.error(error);
		}
	}

	buildCommitMessage(context) {
		return context.config.commit.template
			.replace("{version}", context.version)
			.replace("{message}", context.message)
			.replace("{type}", context.type);
	}

	useGit(context) {
		if (hasFlag(context.flags, "no-git")) {
			return false;
		}

		return context.config ? context.config.git.enabled !== false : true;
	}

	shouldPush(context) {
		if (hasFlag(context.flags, "no-push")) {
			return false;
		}

		return context.config.git.push !== false;
	}

	shouldTag(context) {
		if (hasFlag(context.flags, "tag")) {
			return true;
		}

		if (hasFlag(context.flags, "no-tag")) {
			return false;
		}

		return context.config.git.tag === true;
	}

	mark(value) {
		return value ? "✔" : "✖";
	}
}

module.exports = ReleaseManager;