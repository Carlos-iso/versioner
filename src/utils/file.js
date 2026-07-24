const fs = require("fs");
const path = require("path");

/**
 * Resolve um caminho a partir do diretório onde a CLI foi executada.
 */
function root(...paths) {
	return path.join(process.cwd(), ...paths);
}

/**
 * Resolve um caminho a partir de um diretório específico.
 */
function resolve(cwd, ...paths) {
	return path.join(cwd, ...paths);
}

function exists(file) {
	return fs.existsSync(file);
}

function isDirectory(file) {
	return exists(file) && fs.statSync(file).isDirectory();
}

function readText(file) {
	return fs.readFileSync(file, "utf8");
}

function writeText(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });

	fs.writeFileSync(file, content, "utf8");
}

function readJSON(file) {
	const content = readText(file);

	try {
		return JSON.parse(content);
	} catch (error) {
		throw new Error(`JSON inválido em ${path.basename(file)}: ${error.message}`);
	}
}

/**
 * Escreve JSON preservando a indentação já usada no arquivo
 * (evita diffs gigantes em projetos que usam 2 espaços).
 */
function writeJSON(file, data, indent) {
	const spaces = indent || detectIndent(file);

	writeText(file, `${JSON.stringify(data, null, spaces)}\n`);
}

function detectIndent(file) {
	if (!exists(file)) {
		return 4;
	}

	const match = readText(file).match(/^[ \t]+/m);

	if (!match) {
		return 4;
	}

	return match[0].includes("\t") ? "\t" : match[0].length;
}

module.exports = {
	root,
	resolve,
	exists,
	isDirectory,
	readText,
	writeText,
	readJSON,
	writeJSON,
	detectIndent,
};