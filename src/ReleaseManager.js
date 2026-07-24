const VersionManager = require("./VersionManager");
const ConfigManager = require("./ConfigManager");
const FileManager = require("./FileManager");
const GitManager = require("./GitManager");
const { formatDuration } = require("./utils");

const logger = require("./Logger");

class ReleaseManager {
	constructor() {
		this.versionManager = new VersionManager();
		this.configManager = new ConfigManager();
		this.fileManager = new FileManager();
		this.gitManager = new GitManager();
	}

	validate(context) {
		const types = ["build", "minor", "major"];

		if (!types.includes(context.type)) {
			throw new Error(
				"Tipo de release inválido. Utilize: build, minor ou major.",
			);
		}

		if (!context.message) {
			throw new Error("Informe uma mensagem para o commit.");
		}

		if (context.message.length > 100 ) {
			throw new Error(
				"A mensagem do commit deve ter no máximo 100 caracteres.",
			);
		}

        if (context.message.length < 10 ) {
			throw new Error(
				"A mensagem do commit deve ter no máximo 100 caracteres.",
			);
		}
	}

	run(context) {
		try {
			logger.title("Versioner");
			this.validate(context);
			this.loadConfig(context);
			this.version(context);
			this.updateFiles(context);
			this.git(context);
			this.finish(context);
		} catch (error) {
			logger.error(error.message);
			process.exit(1);
		}
	}

	loadConfig(context) {
		context.config = this.configManager.load();

		logger.success("Configuração carregada.");
	}

	version(context) {
		const result = this.versionManager.increment(context.type);

		context.previousVersion = result.previousVersion;
		context.version = result.version;

		context.previous = result.previous;
		context.current = result.current;

		logger.success(`Versão ${context.previousVersion} → ${context.version}`);

		logger.info(`Mensagem: ${context.message}`);
	}

	updateFiles(context) {
		logger.info("Atualizando arquivos...");

		for (const file of context.config.files) {
			const updated = this.fileManager.update(file, context.version);

			if (!updated) {
				continue;
			}

			context.files.push(file.path);

			logger.success(file.path);
		}
	}

	git(context) {
		logger.info("Executando Git...");

		this.gitManager.add();

		context.git.add = true;

		logger.success("git add");

		const commitMessage = `v${context.version} - ${context.message}`;

		this.gitManager.commit(commitMessage);

		context.git.commit = true;

		logger.success("git commit");

		this.gitManager.push();

		context.git.push = true;

		logger.success("git push");
	}

	finish(context) {
		context.finishedAt = new Date();

		const duration = context.finishedAt - context.startedAt;

		logger.title("Release concluída");

		logger.info(`Versão: ${context.previousVersion} → ${context.version}`);

		logger.info(`Arquivos vercioandos: ${context.files.length}`);

		logger.info(`Git Add: ${context.git.add ? "✔" : "✖"}`);

		logger.info(`Git Commit: ${context.git.commit ? "✔" : "✖"}`);

		logger.info(`Git Push: ${context.git.push ? "✔" : "✖"}`);

		logger.info(`Tempo: ${formatDuration(duration)}s`);
	}
}

module.exports = ReleaseManager;
