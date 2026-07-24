const SUPPORTS_COLOR =
	process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";

const CODES = {
	reset: "\u001b[0m",
	bold: "\u001b[1m",
	dim: "\u001b[2m",
	red: "\u001b[31m",
	green: "\u001b[32m",
	yellow: "\u001b[33m",
	blue: "\u001b[34m",
	cyan: "\u001b[36m",
	gray: "\u001b[90m",
};

function paint(code, text) {
	if (!SUPPORTS_COLOR) {
		return text;
	}

	return `${CODES[code]}${text}${CODES.reset}`;
}

class Logger {
	constructor() {
		this.silent = false;
	}

	setSilent(value) {
		this.silent = Boolean(value);
	}

	write(text = "") {
		if (this.silent) {
			return;
		}

		console.log(text);
	}

	break() {
		this.write("");
	}

	title(text) {
		this.break();
		this.write(paint("bold", paint("cyan", `▌ ${text}`)));
		this.write(paint("gray", "─".repeat(Math.max(text.length + 2, 24))));
	}

	section(text) {
		this.break();
		this.write(paint("bold", text));
	}

	info(text) {
		this.write(`${paint("blue", "ℹ")} ${text}`);
	}

	success(text) {
		this.write(`${paint("green", "✔")} ${text}`);
	}

	warn(text) {
		this.write(`${paint("yellow", "!")} ${text}`);
	}

	error(text) {
		this.write(`${paint("red", "✖")} ${text}`);
	}

	step(text) {
		this.write(`${paint("gray", "→")} ${text}`);
	}

	item(text) {
		this.write(`  ${paint("gray", "•")} ${text}`);
	}

	muted(text) {
		this.write(paint("gray", text));
	}

	/**
	 * Linha de "chave: valor" alinhada.
	 */
	field(label, value, width = 18) {
		const key = `${label}:`.padEnd(width, " ");

		this.write(`  ${paint("gray", key)} ${value}`);
	}

	bold(text) {
		return paint("bold", text);
	}

	dim(text) {
		return paint("gray", text);
	}
}

module.exports = new Logger();
module.exports.Logger = Logger;