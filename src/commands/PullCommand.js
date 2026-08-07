const GitManager = require("../managers/GitManager");
const logger = require("../utils/logger");
const { hasFlag } = require("../utils/args");
const { parse } = require("../utils/args");

class PullCommand {
	async run(args = []) {
		const { flags } = parse(args);
		const git = new GitManager(process.cwd());

		logger.title("Versioner · pull");

		if (!git.isInstalled()) {
			logger.error("Git não encontrado no sistema.");
			return 1;
		}

		if (!git.isRepository()) {
			logger.error('Este diretório não é um repositório Git.');
			return 1;
		}

		if (!git.hasRemote()) {
			logger.error("Nenhum remoto configurado.");
			return 1;
		}

		const useRebase = !hasFlag(flags, "merge");
		const strategy = useRebase ? "--rebase" : "merge";

		logger.info(`Estratégia: ${strategy}`);

		try {
			git.pull({ rebase: useRebase });
			logger.success("Repositório atualizado.");
			logger.break();
			return 0;
		} catch (error) {
			logger.break();
			logger.error(error.message);
			return 1;
		}
	}
}

module.exports = PullCommand;
