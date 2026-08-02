const { resolve, exists, readJSON, writeJSON } = require("../utils/file");
const { VERSION_FILE, DEFAULT_VERSION, VERSION_TYPES } = require("../constants");

class VersionManager {
	constructor(cwd = process.cwd(), versionFile = VERSION_FILE) {
		this.cwd = cwd;
		this.file = resolve(cwd, versionFile || VERSION_FILE);
	}

	exists() {
		return exists(this.file);
	}

	/**
	 * Lê o arquivo de versão.
	 *
	 * A ausência do arquivo é erro, não motivo para recomeçar do zero: criar
	 * o padrão aqui faria a versão do projeto regredir para 0.0.1 na primeira
	 * release, sobrescrevendo a versão real nos arquivos monitorados.
	 */
	load() {
		if (!this.exists()) {
			throw new Error(
				'Arquivo de versão não encontrado. Execute "versioner init" para criá-lo.',
			);
		}

		const version = readJSON(this.file);

		return this.normalize(version);
	}

	/**
	 * Garante que major/minor/build existam e sejam números inteiros.
	 */
	normalize(version) {
		const result = { ...DEFAULT_VERSION };

		for (const key of Object.keys(DEFAULT_VERSION)) {
			const value = Number(version?.[key]);

			if (!Number.isInteger(value) || value < 0) {
				throw new Error(
					`Valor inválido para "${key}" no arquivo de versão. Esperado um inteiro >= 0.`,
				);
			}

			result[key] = value;
		}

		return result;
	}

	save(version) {
		writeJSON(this.file, {
			major: version.major,
			minor: version.minor,
			build: version.build,
		});

		return this.file;
	}

	toString(version) {
		return `${version.major}.${version.minor}.${version.build}`;
	}

	/**
	 * Calcula a próxima versão sem gravar nada.
	 */
	next(type, version) {
		if (!VERSION_TYPES.includes(type)) {
			throw new Error(
				`Tipo de versão inválido: "${type}". Utilize build, minor ou major.`,
			);
		}

		const result = { ...version };

		// A Build sempre incrementa. Ela nunca volta para zero.
		result.build += 1;

		if (type === "minor") {
			result.minor += 1;
		}

		if (type === "major") {
			result.major += 1;
			result.minor = 0;
		}

		return result;
	}

	/**
	 * Incrementa e persiste (a menos que dryRun seja true).
	 */
	increment(type, { dryRun = false } = {}) {
		const previous = this.load();

		const current = this.next(type, previous);

		if (!dryRun) {
			this.save(current);
		}

		return {
			previous,
			current,
			previousVersion: this.toString(previous),
			version: this.toString(current),
		};
	}

	/**
	 * Volta o arquivo de versão para um estado anterior.
	 * Usado quando o Git falha no meio da release.
	 */
	rollback(version) {
		if (!version) {
			return false;
		}

		this.save(version);

		return true;
	}
}

module.exports = VersionManager;