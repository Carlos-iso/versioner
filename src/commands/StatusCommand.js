const VersionManager = require("../managers/VersionManager");
const ConfigManager = require("../managers/ConfigManager");
const GitManager = require("../managers/GitManager");

const logger = require("../utils/logger");
const { resolve, exists, readJSON } = require("../utils/file");
const { getValue } = require("../utils/object");
const { CONFIG_FILE } = require("../constants");

class StatusCommand {
	async run() {
		const cwd = process.cwd();

		const configManager = new ConfigManager(cwd);
		const gitManager = new GitManager(cwd);

		logger.title("Versioner · status");

		if (!configManager.exists()) {
			logger.error(`${CONFIG_FILE} não encontrado. Execute "versioner init".`);
			return 1;
		}

		const config = configManager.load();

		const versionManager = new VersionManager(cwd, config.versionFile);

		// ── Versão ────────────────────────────────────────────
		logger.section("Versão");

		if (versionManager.exists()) {
			const version = versionManager.load();

			logger.field("Atual", logger.bold(versionManager.toString(version)));
			logger.field("Arquivo", config.versionFile);
		} else {
			logger.warn("Arquivo de versão ainda não criado.");
		}

		// ── Arquivos monitorados ──────────────────────────────
		logger.section("Arquivos monitorados");

		if (!config.files.length) {
			logger.muted("  Nenhum arquivo configurado.");
		}

		for (const file of config.files) {
			const filepath = resolve(cwd, file.path);

			if (!exists(filepath)) {
				logger.item(`${file.path} ${logger.dim("(não encontrado)")}`);
				continue;
			}

			let current = "?";

			try {
				current = String(getValue(readJSON(filepath), file.field) ?? "não definido");
			} catch {
				current = "erro ao ler";
			}

			logger.item(`${file.path} ${logger.dim(`(${file.field} = ${current})`)}`);
		}

		// ── Configuração ──────────────────────────────────────
		logger.section("Configuração");

		logger.field("Commit", config.commit.template);
		logger.field("Mensagem", `${config.commit.minLength}–${config.commit.maxLength} caracteres`);
		logger.field("Git", config.git.enabled === false ? "desativado" : "ativado");
		logger.field("Push automático", config.git.push ? "sim" : "não");
		logger.field("Tag automática", config.git.tag ? `sim (${config.git.tagPrefix})` : "não");

		// ── Git ───────────────────────────────────────────────
		logger.section("Git");

		if (!gitManager.isInstalled()) {
			logger.warn("Git não encontrado no sistema.");
			logger.break();
			return 0;
		}

		if (!gitManager.isRepository()) {
			logger.warn("Este diretório não é um repositório Git.");
			logger.break();
			return 0;
		}

		const changes = gitManager.changes();

		logger.field("Branch", gitManager.branch() || "desconhecida");
		logger.field("Remoto", gitManager.hasRemote() ? "configurado" : "nenhum");
		logger.field("Upstream", gitManager.hasUpstream() ? "sim" : "não");
		logger.field("Alterações", changes.length ? `${changes.length} arquivo(s)` : "nenhuma");

		const last = gitManager.lastCommit();

		if (last) {
			logger.field("Último commit", last);
		}

		if (changes.length) {
			logger.break();
			changes.slice(0, 10).forEach((line) => logger.muted(`    ${line}`));

			if (changes.length > 10) {
				logger.muted(`    ... e mais ${changes.length - 10}`);
			}
		}

		logger.break();

		return 0;
	}
}

module.exports = StatusCommand;