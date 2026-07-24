/**
 * Teste de fumaça sem dependências externas.
 *
 * Cria um repositório Git temporário, roda init/build/minor/major
 * e valida o resultado. Executado automaticamente no prepublishOnly.
 *
 *   npm test
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const BIN = path.join(__dirname, "..", "bin", "versioner.js");

let failures = 0;

function assert(condition, label) {
	if (condition) {
		console.log(`  ✔ ${label}`);
		return;
	}

	failures += 1;
	console.log(`  ✖ ${label}`);
}

function run(cwd, args) {
	return execFileSync(process.execPath, [BIN, ...args], {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env, NO_COLOR: "1" },
	});
}

function git(cwd, args) {
	execFileSync("git", args, { cwd, stdio: "ignore" });
}

function readJSON(file) {
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

function setup() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "versioner-test-"));

	git(dir, ["init", "-b", "main"]);
	git(dir, ["config", "user.email", "test@example.com"]);
	git(dir, ["config", "user.name", "Versioner Test"]);

	fs.writeFileSync(
		path.join(dir, "package.json"),
		JSON.stringify({ name: "demo", version: "0.0.0" }, null, 2),
	);

	fs.writeFileSync(
		path.join(dir, "app.json"),
		JSON.stringify({ expo: { name: "demo", version: "0.0.0" } }, null, 2),
	);

	git(dir, ["add", "."]);
	git(dir, ["commit", "-m", "inicial"]);

	return dir;
}

function main() {
	console.log("\nVersioner · smoke test\n");

	const dir = setup();

	// init
	run(dir, ["init", "--yes"]);

	assert(fs.existsSync(path.join(dir, "versioner.config.json")), "init cria versioner.config.json");
	assert(fs.existsSync(path.join(dir, ".versioner.json")), "init cria .versioner.json");

	const config = readJSON(path.join(dir, "versioner.config.json"));

	assert(
		config.files.some((file) => file.path === "package.json"),
		"init detecta package.json",
	);
	assert(
		config.files.some((file) => file.field === "expo.version"),
		"init detecta app.json (expo.version)",
	);

	// build (sem push: não há remoto)
	run(dir, ["build", "primeira release", "--no-push"]);

	assert(readJSON(path.join(dir, ".versioner.json")).build === 1, "build incrementa a build");
	assert(readJSON(path.join(dir, "package.json")).version === "0.0.1", "build atualiza package.json");
	assert(readJSON(path.join(dir, "app.json")).expo.version === "0.0.1", "build atualiza app.json");

	// minor
	run(dir, ["minor", "nova funcionalidade", "--no-push"]);

	const afterMinor = readJSON(path.join(dir, ".versioner.json"));

	assert(afterMinor.minor === 1 && afterMinor.build === 2, "minor incrementa minor e build");

	// major
	run(dir, ["major", "nova arquitetura", "--no-push", "--tag"]);

	const afterMajor = readJSON(path.join(dir, ".versioner.json"));

	assert(
		afterMajor.major === 1 && afterMajor.minor === 0 && afterMajor.build === 3,
		"major incrementa major, zera minor e incrementa build",
	);

	const tags = execFileSync("git", ["tag"], { cwd: dir, encoding: "utf8" });

	assert(tags.includes("v1.0.3"), "--tag cria a tag da release");

	// dry-run não altera nada
	run(dir, ["build", "simulacao", "--dry-run"]);

	assert(
		readJSON(path.join(dir, ".versioner.json")).build === 3,
		"--dry-run não grava alterações",
	);

	// version / status / help
	assert(run(dir, ["version", "--raw"]).trim() === "1.0.3", "version --raw imprime a versão");
	assert(run(dir, ["status"]).includes("Arquivos monitorados"), "status roda sem erro");
	assert(run(dir, ["help"]).includes("build"), "help lista os comandos");

	// validação de mensagem
	let rejected = false;

	try {
		run(dir, ["build"]);
	} catch {
		rejected = true;
	}

	assert(rejected, "build sem mensagem é rejeitado");

	// versão não pode ter avançado após a falha (rollback)
	assert(
		readJSON(path.join(dir, ".versioner.json")).build === 3,
		"falha na release não avança a versão",
	);

	fs.rmSync(dir, { recursive: true, force: true });

	console.log(`\n${failures ? `${failures} falha(s).` : "Todos os testes passaram."}\n`);

	process.exit(failures ? 1 : 0);
}

main();