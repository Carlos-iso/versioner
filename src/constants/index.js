/**
 * Constantes globais do Versioner.
 * Nenhuma regra de negócio aqui, apenas valores fixos.
 */

const VERSION_FILE = ".versioner.json";

const CONFIG_FILE = "versioner.config.json";

const VERSION_TYPES = ["build", "minor", "major"];

const DEFAULT_VERSION = {
	major: 0,
	minor: 0,
	build: 0,
};

const DEFAULT_COMMIT = {
	template: "v{version} - {message}",
	minLength: 3,
	maxLength: 100,
};

const DEFAULT_GIT = {
	enabled: true,
	add: true,
	commit: true,
	push: true,
	tag: false,
	tagPrefix: "v",
	tagMessage: "Release {version}",
};

const DEFAULT_CONFIG = {
	versionFile: VERSION_FILE,
	files: [],
	commit: DEFAULT_COMMIT,
	git: DEFAULT_GIT,
};

/**
 * Arquivos que o `init` tenta detectar automaticamente.
 * `json: false` significa que o arquivo é código e não pode ser
 * versionado automaticamente (apenas avisamos o usuário).
 */
const DETECTABLE_FILES = [
	{ path: "package.json", field: "version", json: true },
	{ path: "app.json", field: "expo.version", json: true },
	{ path: "manifest.json", field: "version", json: true },
	{ path: "app.config.js", json: false },
	{ path: "app.config.ts", json: false },
];

/**
 * Metadados usados pelo HelpCommand e pelo CommandRouter.
 */
const COMMANDS = [
	{
		name: "init",
		usage: "versioner init [--yes] [--force]",
		summary: "Inicializa o Versioner no projeto atual.",
		details: [
			"Verifica se existe um repositório Git.",
			`Cria o ${VERSION_FILE} (contador de versão).`,
			`Cria o ${CONFIG_FILE} (arquivos monitorados).`,
			"Detecta package.json, app.json, app.config.js e app.config.ts.",
			"Pergunta a versão inicial do projeto.",
			"",
			"Flags:",
			"  --yes, -y     Usa os valores padrão sem perguntar nada.",
			"  --force, -f   Sobrescreve arquivos já existentes.",
		],
	},
	{
		name: "build",
		usage: 'versioner build "mensagem do commit"',
		summary: "Incrementa a Build e publica a release.",
		details: [
			"Exemplo: 1.4.272 → 1.4.273",
			"",
			"Flags:",
			"  --no-push     Faz commit mas não envia para o remoto.",
			"  --no-git      Apenas versiona os arquivos, sem tocar no Git.",
			"  --tag         Cria uma tag Git para essa release.",
			"  --dry-run     Simula tudo sem gravar nada.",
		],
	},
	{
		name: "minor",
		usage: 'versioner minor "mensagem do commit"',
		summary: "Incrementa Minor e Build e publica a release.",
		details: ["Exemplo: 1.4.272 → 1.5.273", "", "Aceita as mesmas flags do build."],
	},
	{
		name: "major",
		usage: 'versioner major "mensagem do commit"',
		summary: "Incrementa Major, zera Minor, incrementa Build.",
		details: ["Exemplo: 1.4.272 → 2.0.273", "", "Aceita as mesmas flags do build."],
	},
	{
		name: "version",
		usage: "versioner version [--json]",
		summary: "Mostra a versão atual do projeto.",
		details: [
			"Flags:",
			"  --json        Retorna a versão em JSON.",
			"  --raw         Retorna apenas a string da versão.",
			"  --self        Mostra a versão do próprio Versioner.",
		],
	},
	{
		name: "status",
		usage: "versioner status",
		summary: "Mostra versão, arquivos monitorados e estado do Git.",
		details: [],
	},
	{
		name: "help",
		usage: "versioner help [comando]",
		summary: "Lista os comandos disponíveis.",
		details: [],
	},
];

const ALIASES = {
	b: "build",
	m: "minor",
	M: "major",
	i: "init",
	h: "help",
	v: "version",
	s: "status",
	"--help": "help",
	"-h": "help",
	"--version": "version",
	"-v": "version",
};

module.exports = {
	VERSION_FILE,
	CONFIG_FILE,
	VERSION_TYPES,
	DEFAULT_VERSION,
	DEFAULT_COMMIT,
	DEFAULT_GIT,
	DEFAULT_CONFIG,
	DETECTABLE_FILES,
	COMMANDS,
	ALIASES,
};