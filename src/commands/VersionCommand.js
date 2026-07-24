const path = require("path");

const VersionManager = require("../managers/VersionManager");
const ConfigManager = require("../managers/ConfigManager");

const logger = require("../utils/logger");
const { readJSON } = require("../utils/file");
const { parse, hasFlag } = require("../utils/args");
const { VERSION_FILE } = require("../constants");

class VersionCommand {
	async run(args = []) {
		const { flags } = parse(args);

		// Versão do próprio Versioner
		if (hasFlag(flags, "self")) {
			const pkg = readJSON(path.join(__dirname, "..", "..", "package.json"));

			console.log(pkg.version);

			return 0;
		}

		const cwd = process.cwd();

		const configManager = new ConfigManager(cwd);

		const versionFile = configManager.exists()
			? configManager.load().versionFile
			: VERSION_FILE;

		const versionManager = new VersionManager(cwd, versionFile);

		if (!versionManager.exists()) {
			logger.error('Projeto não inicializado. Execute "versioner init".');
			return 1;
		}

		const version = versionManager.load();
		const text = versionManager.toString(version);

		if (hasFlag(flags, "json")) {
			console.log(JSON.stringify({ ...version, version: text }, null, 2));
			return 0;
		}

		if (hasFlag(flags, "raw")) {
			console.log(text);
			return 0;
		}

		logger.title("Versioner · version");
		logger.field("Versão", logger.bold(text));
		logger.field("Major", String(version.major));
		logger.field("Minor", String(version.minor));
		logger.field("Build", String(version.build));
		logger.break();

		return 0;
	}
}

module.exports = VersionCommand;