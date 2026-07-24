const logger = require("../utils/logger");
const { parse } = require("../utils/args");
const { COMMANDS, ALIASES } = require("../constants");

class HelpCommand {
	async run(args = []) {
		const { values } = parse(args);

		const target = values[0];

		if (target) {
			return this.detail(ALIASES[target] || target);
		}

		return this.overview();
	}

	overview() {
		logger.title("Versioner");

		logger.muted("  Automatiza versionamento e fluxo de Git em um único comando.");

		logger.section("Uso");
		logger.muted("  versioner <comando> [argumentos] [flags]");

		logger.section("Comandos");

		const width = Math.max(...COMMANDS.map((command) => command.name.length)) + 4;

		for (const command of COMMANDS) {
			logger.write(`  ${logger.bold(command.name.padEnd(width))}${command.summary}`);
		}

		logger.section("Exemplos");
		logger.muted("  versioner init");
		logger.muted('  versioner build "Corrige o login"');
		logger.muted('  versioner minor "Adiciona filtros na busca"');
		logger.muted('  versioner major "Nova arquitetura" --tag');
		logger.muted("  versioner status");

		logger.section("Ajuda de um comando");
		logger.muted("  versioner help build");
		logger.break();

		return 0;
	}

	detail(name) {
		const command = COMMANDS.find((item) => item.name === name);

		if (!command) {
			logger.error(`Comando desconhecido: ${name}`);
			logger.muted('  Use "versioner help" para ver a lista de comandos.');
			logger.break();

			return 1;
		}

		logger.title(`Versioner · ${command.name}`);

		logger.muted(`  ${command.summary}`);

		logger.section("Uso");
		logger.muted(`  ${command.usage}`);

		if (command.details.length) {
			logger.section("Detalhes");
			command.details.forEach((line) => logger.muted(`  ${line}`));
		}

		logger.break();

		return 0;
	}
}

module.exports = HelpCommand;