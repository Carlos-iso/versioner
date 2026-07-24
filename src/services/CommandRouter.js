const BuildCommand = require("../commands/BuildCommand");
const MinorCommand = require("../commands/MinorCommand");
const MajorCommand = require("../commands/MajorCommand");
const InitCommand = require("../commands/InitCommand");
const HelpCommand = require("../commands/HelpCommand");
const VersionCommand = require("../commands/VersionCommand");
const StatusCommand = require("../commands/StatusCommand");

const logger = require("../utils/logger");
const { ALIASES } = require("../constants");

/**
 * Despacha o comando digitado na CLI.
 * Sem switch: usa um mapa nome → classe.
 */
class CommandRouter {
	constructor() {
		this.commands = {
			build: BuildCommand,
			minor: MinorCommand,
			major: MajorCommand,
			init: InitCommand,
			help: HelpCommand,
			version: VersionCommand,
			status: StatusCommand,
		};
	}

	resolve(name) {
		if (!name) {
			return null;
		}

		return this.commands[ALIASES[name] || name] || null;
	}

	async run(args = []) {
		const [name, ...rest] = args;

		// Sem argumentos: mostra a ajuda.
		if (!name) {
			return new HelpCommand().run([]);
		}

		const Command = this.resolve(name);

		if (!Command) {
			logger.error(`Comando desconhecido: ${name}`);

			const suggestion = this.suggest(name);

			if (suggestion) {
				logger.muted(`  Você quis dizer "${suggestion}"?`);
			}

			logger.muted('  Use "versioner help" para ver a lista de comandos.');
			logger.break();

			return 1;
		}

		return new Command().run(rest);
	}

	/**
	 * Sugestão simples por distância de Levenshtein.
	 */
	suggest(name) {
		let best = null;
		let bestDistance = Infinity;

		for (const command of Object.keys(this.commands)) {
			const distance = this.distance(name.toLowerCase(), command);

			if (distance < bestDistance) {
				bestDistance = distance;
				best = command;
			}
		}

		return bestDistance <= 2 ? best : null;
	}

	distance(a, b) {
		const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);

		for (let j = 0; j <= b.length; j += 1) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= a.length; i += 1) {
			for (let j = 1; j <= b.length; j += 1) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;

				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j - 1] + cost,
				);
			}
		}

		return matrix[a.length][b.length];
	}
}

module.exports = CommandRouter;