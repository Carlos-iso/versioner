const ReleaseManager = require("../managers/ReleaseManager");
const { createContext } = require("../core/Context");
const { parse, toMessage } = require("../utils/args");

/**
 * Base dos comandos de release (build, minor, major).
 * Monta o Context e delega tudo ao ReleaseManager.
 */
class BaseCommand {
	/**
	 * Sobrescrito pelas subclasses: "build" | "minor" | "major".
	 */
	get type() {
		throw new Error("Comando sem tipo definido.");
	}

	async run(args = []) {
		const { values, flags } = parse(args);

		const context = createContext({
			type: this.type,
			message: toMessage(values),
			args: values,
			cwd: process.cwd(),
			flags,
		});

		const release = new ReleaseManager(context.cwd);

		return release.run(context);
	}
}

module.exports = BaseCommand;