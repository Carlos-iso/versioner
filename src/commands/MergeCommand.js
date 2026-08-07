const GitManager = require("../managers/GitManager");
const logger = require("../utils/logger");
const { parse } = require("../utils/args");

class MergeCommand {
	async run(args = []) {
		const { values } = parse(args);
		const branch = values[0];
		const git = new GitManager(process.cwd());

		logger.title("Versioner · merge");

		if (!git.isInstalled()) {
			logger.error("Git não encontrado no sistema.");
			return 1;
		}

		if (!git.isRepository()) {
			logger.error('Este diretório não é um repositório Git.');
			return 1;
		}

		if (!branch) {
			logger.error('Informe o nome do branch. Exemplo: versioner merge feature/login');
			return 1;
		}

		try {
			git.merge(branch);
			logger.success(`Branch "${branch}" incorporado com sucesso.`);
			logger.break();
			return 0;
		} catch (error) {
			logger.break();
			logger.error(error.message);
			return 1;
		}
	}
}

module.exports = MergeCommand;
