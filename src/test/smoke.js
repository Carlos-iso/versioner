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

const BIN = path.join(__dirname, "../../", "bin", "versioner.js");

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

function writeJSON(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

function lastCommitFiles(cwd) {
	return execFileSync("git", ["show", "--name-only", "--format=", "HEAD"], {
		cwd,
		encoding: "utf8",
	})
		.trim()
		.split("\n")
		.filter(Boolean);
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

function setupWithRemote() {
	const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "versioner-bare-"));
	execFileSync("git", ["init", "--bare", bareDir], { stdio: "ignore" });

	const localDir = fs.mkdtempSync(path.join(os.tmpdir(), "versioner-local-"));
	execFileSync("git", ["clone", bareDir, localDir], { stdio: "ignore" });
	git(localDir, ["config", "user.email", "test@example.com"]);
	git(localDir, ["config", "user.name", "Versioner Test"]);

	fs.writeFileSync(path.join(localDir, "file.txt"), "initial");
	git(localDir, ["add", "."]);
	git(localDir, ["commit", "-m", "inicial"]);
	git(localDir, ["push", "-u", "origin", "main"]);

	// Simula outro colaborador fazendo push no remoto
	const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), "versioner-other-"));
	execFileSync("git", ["clone", bareDir, otherDir], { stdio: "ignore" });
	git(otherDir, ["config", "user.email", "other@example.com"]);
	git(otherDir, ["config", "user.name", "Other Dev"]);
	fs.writeFileSync(path.join(otherDir, "remote-change.txt"), "from remote");
	git(otherDir, ["add", "."]);
	git(otherDir, ["commit", "-m", "commit remoto"]);
	git(otherDir, ["push"]);

	return { localDir, bareDir, otherDir };
}

function main() {
	console.log("\nVersioner · smoke test\n");

	const dir = setup();

	// ── init ──────────────────────────────────────────────────────────
	console.log("init:");

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

	// ── release padrão ────────────────────────────────────────────────
	console.log("\nrelease padrão:");

	run(dir, ["build", "primeira release", "--no-push"]);

	assert(readJSON(path.join(dir, ".versioner.json")).build === 1, "build incrementa a build");
	assert(readJSON(path.join(dir, "package.json")).version === "0.0.1", "build atualiza package.json");
	assert(readJSON(path.join(dir, "app.json")).expo.version === "0.0.1", "build atualiza app.json");

	run(dir, ["minor", "nova funcionalidade", "--no-push"]);

	const afterMinor = readJSON(path.join(dir, ".versioner.json"));

	assert(afterMinor.minor === 1 && afterMinor.build === 2, "minor incrementa minor e build");

	run(dir, ["major", "nova arquitetura", "--no-push", "--tag"]);

	const afterMajor = readJSON(path.join(dir, ".versioner.json"));

	assert(
		afterMajor.major === 1 && afterMajor.minor === 0 && afterMajor.build === 3,
		"major incrementa major, zera minor e incrementa build",
	);

	const tags = execFileSync("git", ["tag"], { cwd: dir, encoding: "utf8" });

	assert(tags.includes("v1.0.3"), "--tag cria a tag da release");

	run(dir, ["build", "simulacao", "--dry-run"]);

	assert(
		readJSON(path.join(dir, ".versioner.json")).build === 3,
		"--dry-run não grava alterações",
	);

	assert(run(dir, ["version", "--raw"]).trim() === "1.0.3", "version --raw imprime a versão");
	assert(run(dir, ["status"]).includes("Arquivos monitorados"), "status roda sem erro");
	assert(run(dir, ["help"]).includes("build"), "help lista os comandos");

	let rejected = false;

	try {
		run(dir, ["build"]);
	} catch {
		rejected = true;
	}

	assert(rejected, "build sem mensagem é rejeitado");
	assert(
		readJSON(path.join(dir, ".versioner.json")).build === 3,
		"falha na release não avança a versão",
	);

	// ── SemVer ────────────────────────────────────────────────────────
	console.log("\nSemVer:");

	const cfgPath = path.join(dir, "versioner.config.json");
	const vFile = path.join(dir, ".versioner.json");

	// Reseta para versão conhecida e habilita SemVer
	writeJSON(vFile, { major: 1, minor: 0, build: 0 });
	const cfg = readJSON(cfgPath);
	cfg.semver = true;
	writeJSON(cfgPath, cfg);
	git(dir, ["add", "."]);
	git(dir, ["commit", "-m", "habilita semver"]);

	run(dir, ["build", "patch fix", "--no-push"]);
	const afterSVBuild = readJSON(vFile);
	assert(afterSVBuild.build === 1, "semver: build incrementa patch");
	assert(afterSVBuild.minor === 0, "semver: build não altera minor");
	assert(afterSVBuild.major === 1, "semver: build não altera major");

	run(dir, ["minor", "nova feature", "--no-push"]);
	const afterSVMinor = readJSON(vFile);
	assert(afterSVMinor.minor === 1, "semver: minor incrementa minor");
	assert(afterSVMinor.build === 0, "semver: minor zera patch");
	assert(afterSVMinor.major === 1, "semver: minor não altera major");

	run(dir, ["major", "breaking change", "--no-push"]);
	const afterSVMajor = readJSON(vFile);
	assert(afterSVMajor.major === 2, "semver: major incrementa major");
	assert(afterSVMajor.minor === 0, "semver: major zera minor");
	assert(afterSVMajor.build === 0, "semver: major zera patch");

	// Confirma que o padrão (semver:false) mantém build global
	cfg.semver = false;
	writeJSON(cfgPath, cfg);
	writeJSON(vFile, { major: 1, minor: 0, build: 5 });
	git(dir, ["add", "."]);
	git(dir, ["commit", "-m", "desabilita semver"]);

	run(dir, ["minor", "padrao novamente", "--no-push"]);
	const afterDefaultMinor = readJSON(vFile);
	assert(afterDefaultMinor.build === 6, "padrão: build nunca zera no minor");
	assert(afterDefaultMinor.minor === 1, "padrão: minor incrementa normalmente");

	// ── Add por arquivo ───────────────────────────────────────────────
	console.log("\nadd por arquivo:");

	cfg.git = { ...cfg.git, addAll: false };
	cfg.semver = false;
	writeJSON(cfgPath, cfg);
	git(dir, ["add", "."]);
	git(dir, ["commit", "-m", "habilita addAll:false"]);

	fs.writeFileSync(path.join(dir, "feature.js"), "// nova feature");
	fs.writeFileSync(path.join(dir, "unrelated.js"), "// nao relacionado");

	run(dir, ["build", "feature.js", "adiciona feature", "--no-push"]);

	const committed = lastCommitFiles(dir);
	assert(committed.includes("feature.js"), "addAll:false inclui arquivo especificado");
	assert(committed.includes("package.json"), "addAll:false sempre inclui arquivos de versão");
	assert(committed.includes(".versioner.json"), "addAll:false sempre inclui o arquivo de versão");
	assert(!committed.includes("unrelated.js"), "addAll:false não inclui arquivos não especificados");

	const statusOutput = execFileSync("git", ["status", "--porcelain"], {
		cwd: dir,
		encoding: "utf8",
	});
	assert(statusOutput.includes("unrelated.js"), "arquivos não especificados permanecem no working tree");

	// Múltiplos arquivos
	fs.writeFileSync(path.join(dir, "a.js"), "a");
	fs.writeFileSync(path.join(dir, "b.js"), "b");
	fs.writeFileSync(path.join(dir, "c.js"), "c");

	run(dir, ["build", "a.js b.js", "dois arquivos juntos", "--no-push"]);

	const committedMulti = lastCommitFiles(dir);
	assert(committedMulti.includes("a.js"), "addAll:false aceita múltiplos arquivos (a.js)");
	assert(committedMulti.includes("b.js"), "addAll:false aceita múltiplos arquivos (b.js)");
	assert(!committedMulti.includes("c.js"), "addAll:false não inclui terceiro arquivo não especificado");

	// Restaura addAll:true para os demais testes
	cfg.git = { ...cfg.git, addAll: true };
	writeJSON(cfgPath, cfg);
	git(dir, ["add", "."]);
	git(dir, ["commit", "-m", "restaura addAll:true"]);

	// ── Pull ──────────────────────────────────────────────────────────
	console.log("\npull:");

	let pullRejected = false;
	try {
		run(dir, ["pull"]);
	} catch {
		pullRejected = true;
	}
	assert(pullRejected, "pull sem remoto retorna erro");

	const { localDir, bareDir, otherDir } = setupWithRemote();

	run(localDir, ["pull"]);
	assert(
		fs.existsSync(path.join(localDir, "remote-change.txt")),
		"pull (rebase) traz mudanças do remoto",
	);

	const { localDir: localDir2, bareDir: bareDir2, otherDir: otherDir2 } = setupWithRemote();

	run(localDir2, ["pull", "--merge"]);
	assert(
		fs.existsSync(path.join(localDir2, "remote-change.txt")),
		"pull --merge traz mudanças do remoto",
	);

	fs.rmSync(localDir, { recursive: true, force: true });
	fs.rmSync(bareDir, { recursive: true, force: true });
	fs.rmSync(otherDir, { recursive: true, force: true });
	fs.rmSync(localDir2, { recursive: true, force: true });
	fs.rmSync(bareDir2, { recursive: true, force: true });
	fs.rmSync(otherDir2, { recursive: true, force: true });

	// ── Merge ─────────────────────────────────────────────────────────
	console.log("\nmerge:");

	git(dir, ["checkout", "-b", "feature-test"]);
	fs.writeFileSync(path.join(dir, "feature-branch.txt"), "conteudo da feature");
	git(dir, ["add", "."]);
	git(dir, ["commit", "-m", "commit no branch"]);
	git(dir, ["checkout", "main"]);

	run(dir, ["merge", "feature-test"]);
	assert(
		fs.existsSync(path.join(dir, "feature-branch.txt")),
		"merge incorpora arquivos do branch",
	);

	let mergeRejected = false;
	try {
		run(dir, ["merge"]);
	} catch {
		mergeRejected = true;
	}
	assert(mergeRejected, "merge sem branch retorna erro");

	// ── Finalização ───────────────────────────────────────────────────
	fs.rmSync(dir, { recursive: true, force: true });

	console.log(`\n${failures ? `${failures} falha(s).` : "Todos os testes passaram."}\n`);

	process.exit(failures ? 1 : 0);
}

main();
