const SHORT_FLAGS = {
	y: "yes",
	f: "force",
	n: "no-git",
	d: "dry-run",
};

/**
 * Separa flags de valores posicionais.
 *
 * parse(['build', 'Corrige login', '--no-push'])
 * → { values: ['build', 'Corrige login'], flags: { 'no-push': true } }
 *
 * Suporta `--chave=valor`.
 */
function parse(argv = []) {
	const values = [];
	const flags = {};

	for (const arg of argv) {
		if (typeof arg !== "string") {
			continue;
		}

		if (arg.startsWith("--")) {
			const [key, value] = arg.slice(2).split("=");

			flags[key] = value === undefined ? true : value;
			continue;
		}

		if (arg.startsWith("-") && arg.length > 1) {
			for (const letter of arg.slice(1)) {
				flags[SHORT_FLAGS[letter] || letter] = true;
			}
			continue;
		}

		values.push(arg);
	}

	return { values, flags };
}

/**
 * Junta os valores posicionais em uma mensagem de commit.
 */
function toMessage(values) {
	return values.join(" ").trim();
}

function hasFlag(flags, ...names) {
	return names.some((name) => flags[name] === true || flags[name] === "true");
}

module.exports = {
	parse,
	toMessage,
	hasFlag,
};