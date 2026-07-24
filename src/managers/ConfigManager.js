const { resolve, exists, readJSON, writeJSON } = require("../utils/file");
const { merge } = require("../utils/object");
const { CONFIG_FILE, DEFAULT_CONFIG } = require("../constants");

class ConfigManager {
	constructor(cwd = process.cwd()) {
		this.cwd = cwd;
		this.file = resolve(cwd, CONFIG_FILE);
	}

	exists() {
		return exists(this.file);
	}

	/**
	 * Carrega a configuração, aplica os defaults e valida o formato.
	 */
	load() {
		if (!this.exists()) {
			throw new Error(
				`Arquivo ${CONFIG_FILE} não encontrado. Execute "versioner init" neste projeto.`,
			);
		}

		const raw = readJSON(this.file);

		const config = merge(DEFAULT_CONFIG, raw);

		this.validate(config);

		return config;
	}

	validate(config) {
		if (!Array.isArray(config.files)) {
			throw new Error(`"files" deve ser um array em ${CONFIG_FILE}.`);
		}

		config.files.forEach((file, index) => {
			if (!file || typeof file !== "object") {
				throw new Error(`files[${index}] deve ser um objeto em ${CONFIG_FILE}.`);
			}

			if (!file.path) {
				throw new Error(`files[${index}] está sem a propriedade "path".`);
			}

			if (!file.field) {
				throw new Error(`files[${index}] (${file.path}) está sem a propriedade "field".`);
			}
		});

		if (!config.versionFile) {
			throw new Error(`"versionFile" não pode ser vazio em ${CONFIG_FILE}.`);
		}

		return true;
	}

	/**
	 * Cria/sobrescreve o arquivo de configuração.
	 */
	save(config) {
		writeJSON(this.file, config);

		return this.file;
	}
}

module.exports = ConfigManager;