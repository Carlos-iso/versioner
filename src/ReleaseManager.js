const VersionManager = require("./VersionManager");
const ConfigManager = require("./ConfigManager");
const FileManager = require("./FileManager");
const GitManager = require("./GitManager");
const logger = require("./Logger");

class ReleaseManager {
	constructor() {
		this.versionManager = new VersionManager();
		this.configManager = new ConfigManager();
		this.fileManager = new FileManager();
		this.gitManager = new GitManager();
	}

	run(context) {
		logger.title("Versioner");

		context.config = this.configManager.load();

		const result = this.versionManager.increment(context.type);

		context.previousVersion = result.previousVersion;
		context.version = result.currentVersion;

		context.previous = result.previous;
		context.current = result.current;

		for (const file of context.config.files) {
			const updated = this.fileManager.update(file, context.version);

			if (updated) {
				context.files.push(file.path);
			}
		}

		logger.success(`Versão ${context.previousVersion} -> ${context.version}`);

        logger.info("Arquivos atualizados:");

		for (const file of context.files) {
			logger.success(file);
		}

		logger.info("Git");

		const commitMessage = `v${context.version} - ${context.message}`;

		this.gitManager.add();

		context.git.add = true; 

		logger.success("git add");

		this.gitManager.commit(commitMessage);

		context.git.commit = true;

		logger.success("git commit");

		this.gitManager.push();

		context.git.push = true;

		logger.success("git push");
	}
}

module.exports = ReleaseManager;
