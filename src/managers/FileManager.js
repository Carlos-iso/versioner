const { resolve, exists, readJSON, writeJSON, readText, writeText } = require("../utils/file");
const { setValue, getValue } = require("../utils/object");

class FileManager {
	constructor(cwd = process.cwd()) {
		this.cwd = cwd;

		// Guarda o conteúdo original para permitir rollback.
		this.backups = [];
	}

	/**
	 * Atualiza a versão dentro de um arquivo JSON.
	 *
	 * @returns {{ updated: boolean, reason?: string, from?: string }}
	 */
	update(file, version, { dryRun = false } = {}) {
		const filepath = resolve(this.cwd, file.path);

		if (!exists(filepath)) {
			return { updated: false, reason: "arquivo não encontrado" };
		}

		if (!filepath.endsWith(".json")) {
			return { updated: false, reason: "apenas arquivos .json são suportados" };
		}

		const json = readJSON(filepath);

		const from = getValue(json, file.field);

		if (from === version) {
			return { updated: false, reason: "já está na versão atual", from };
		}

		if (dryRun) {
			return { updated: true, from, dryRun: true };
		}

		this.backups.push({ filepath, content: readText(filepath) });

		setValue(json, file.field, version);

		writeJSON(filepath, json);

		return { updated: true, from };
	}

	/**
	 * Restaura todos os arquivos alterados nesta execução.
	 */
	rollback() {
		let restored = 0;

		while (this.backups.length) {
			const backup = this.backups.pop();

			try {
				writeText(backup.filepath, backup.content);
				restored += 1;
			} catch {
				// Um arquivo que não pode ser restaurado não deve
				// impedir a restauração dos demais.
			}
		}

		return restored;
	}

	clearBackups() {
		this.backups = [];
	}
}

module.exports = FileManager;