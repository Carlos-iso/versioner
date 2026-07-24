const readline = require("readline");

const ConfigManager = require("../managers/ConfigManager");
const VersionManager = require("../managers/VersionManager");
const GitManager = require("../managers/GitManager");

const logger = require("../utils/logger");
const { resolve, exists, readJSON } = require("../utils/file");
const { parse, hasFlag } = require("../utils/args");
const {
	CONFIG_FILE,
	VERSION_FILE,
	DEFAULT_CONFIG,
	DEFAULT_VERSION,
	DETECTABLE_FILES,
} = require("../constants");

class InitCommand {
	async run(args = []) {
		const { flags } = parse(args);

		const cwd = process.cwd();

		const auto = hasFlag(flags, "yes");
		const force = hasFlag(flags, "force");

		const configManager = new ConfigManager(cwd);
		const versionManager = new VersionManager(cwd, VERSION_FILE);
		const gitManager = new GitManager(cwd);

		logger.title("Versioner · init");

		// 1. Repositório Git
		if (!gitManager.isInstalled()) {
			logger.error("Git não encontrado no sistema.");
			return 1;
		}

		if (!gitManager.isRepository()) {
			logger.warn('Nenhum repositório Git encontrado. Rode "git init" antes de publicar.');
		} else {
			logger.success(`Repositório Git detectado (branch: ${gitManager.branch()}).`);
		}

		// 2. Arquivos já existentes
		if ((configManager.exists() || versionManager.exists()) && !force) {
			logger.error(
				`O Versioner já está inicializado neste projeto. Use --force para sobrescrever.`,
			);
			return 1;
		}

		// 3. Detecção de arquivos
		const detected = this.detect(cwd);

		if (detected.supported.length) {
			logger.success("Arquivos detectados:");
			detected.supported.forEach((file) => logger.item(`${file.path} (${file.field})`));
		} else {
			logger.warn("Nenhum arquivo JSON de versão foi detectado.");
		}

		detected.unsupported.forEach((file) => {
			logger.warn(
				`${file.path} detectado, mas arquivos de código não são versionados automaticamente.`,
			);
		});

		// 4. Versão inicial
		const initial = auto
			? this.fromPackage(cwd) || { ...DEFAULT_VERSION }
			: await this.ask(cwd);

		// 5. Gravação
		const config = {
			...DEFAULT_CONFIG,
			versionFile: VERSION_FILE,
			files: detected.supported.map((file) => ({
				path: file.path,
				field: file.field,
			})),
		};

		configManager.save(config);
		versionManager.save(initial);

		logger.break();
		logger.success(`${CONFIG_FILE} criado.`);
		logger.success(`${VERSION_FILE} criado.`);

		logger.section("Versão inicial");
		logger.field("Versão", versionManager.toString(initial));

		logger.section("Próximo passo");
		logger.muted('  versioner build "primeira release"');
		logger.break();

		return 0;
	}

	/**
	 * Procura arquivos conhecidos no diretório atual.
	 */
	detect(cwd) {
		const supported = [];
		const unsupported = [];

		for (const file of DETECTABLE_FILES) {
			if (!exists(resolve(cwd, file.path))) {
				continue;
			}

			if (file.json) {
				supported.push(file);
			} else {
				unsupported.push(file);
			}
		}

		return { supported, unsupported };
	}

	/**
	 * Tenta reaproveitar a versão já presente no package.json.
	 */
	fromPackage(cwd) {
		const filepath = resolve(cwd, "package.json");

		if (!exists(filepath)) {
			return null;
		}

		try {
			const version = readJSON(filepath).version;

			return this.parseVersion(version);
		} catch {
			return null;
		}
	}

	parseVersion(value) {
		const match = String(value || "").match(/^(\d+)\.(\d+)\.(\d+)/);

		if (!match) {
			return null;
		}

		return {
			major: Number(match[1]),
			minor: Number(match[2]),
			build: Number(match[3]),
		};
	}

	/**
	 * Pergunta interativa da versão inicial.
	 */
	async ask(cwd) {
		const suggestion = this.fromPackage(cwd) || { ...DEFAULT_VERSION };

		const suggested = `${suggestion.major}.${suggestion.minor}.${suggestion.build}`;

		logger.break();

		const answer = await this.prompt(`Versão inicial [${suggested}]: `);

		if (!answer.trim()) {
			return suggestion;
		}

		const parsed = this.parseVersion(answer.trim().replace(/^v/i, ""));

		if (!parsed) {
			logger.warn(`Formato inválido. Usando ${suggested}.`);
			return suggestion;
		}

		return parsed;
	}

	prompt(question) {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		return new Promise((resolveAnswer) => {
			rl.question(question, (answer) => {
				rl.close();
				resolveAnswer(answer);
			});
		});
	}
}

module.exports = InitCommand;