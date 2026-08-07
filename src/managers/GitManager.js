const { execFileSync } = require("child_process");

class GitManager {
	constructor(cwd = process.cwd()) {
		this.cwd = cwd;
	}

	/**
	 * Executa um comando git.
	 * Usa execFileSync com array de argumentos: a mensagem de commit
	 * nunca passa pelo shell, então aspas e $ não quebram nada.
	 */
	run(args, { silent = false } = {}) {
		return execFileSync("git", args, {
			cwd: this.cwd,
			stdio: silent ? ["ignore", "pipe", "pipe"] : "inherit",
			encoding: "utf8",
		});
	}

	/**
	 * Executa e devolve a saída, sem lançar erro.
	 */
	query(args) {
		try {
			return String(this.run(args, { silent: true }) || "").trim();
		} catch {
			return null;
		}
	}

	isInstalled() {
		return this.query(["--version"]) !== null;
	}

	isRepository() {
		return this.query(["rev-parse", "--is-inside-work-tree"]) === "true";
	}

	branch() {
		return this.query(["rev-parse", "--abbrev-ref", "HEAD"]);
	}

	/**
	 * Commit atual. Devolve null em repositório sem commits.
	 */
	head() {
		return this.query(["rev-parse", "HEAD"]);
	}

	/**
	 * Grava o índice atual como uma árvore e devolve o hash dela.
	 * Usado antes do "git add" para que o rollback consiga restaurar
	 * exatamente o que o usuário já tinha preparado, inclusive alterações
	 * adicionadas parcialmente.
	 */
	saveIndex() {
		return this.query(["write-tree"]);
	}

	/**
	 * Restaura o índice a partir de uma árvore salva por saveIndex(),
	 * sem tocar no working tree.
	 */
	restoreIndex(tree) {
		if (!tree) {
			return { success: false, reason: "índice anterior não foi salvo" };
		}

		this.run(["read-tree", tree], { silent: true });

		return { success: true };
	}

	/**
	 * Desfaz o commit da release preservando o working tree.
	 * Sem commit anterior, o da release era o primeiro do repositório:
	 * nesse caso a própria referência precisa ser removida.
	 */
	undoCommit(previousHead) {
		if (previousHead) {
			this.run(["reset", "--soft", previousHead], { silent: true });
		} else {
			this.run(["update-ref", "-d", "HEAD"], { silent: true });
		}

		return { success: true };
	}

	deleteTag(name) {
		if (!this.tagExists(name)) {
			return { success: false, reason: "tag não existe" };
		}

		this.run(["tag", "-d", name], { silent: true });

		return { success: true };
	}

	hasRemote() {
		const remotes = this.query(["remote"]);

		return Boolean(remotes && remotes.length);
	}

	hasUpstream() {
		return this.query(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]) !== null;
	}

	/**
	 * Lista de arquivos modificados (porcelain).
	 */
	changes() {
		const output = this.query(["status", "--porcelain"]);

		if (!output) {
			return [];
		}

		return output
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
	}

	hasChanges() {
		return this.changes().length > 0;
	}

	lastCommit() {
		return this.query(["log", "-1", "--pretty=%s"]);
	}

	/**
	 * Adiciona arquivos ao stage.
	 * Sem argumentos: git add . (todos os arquivos).
	 * Com array de arquivos: git add arquivo1 arquivo2...
	 */
	add(files = null) {
		if (files && files.length) {
			this.run(["add", ...files]);
		} else {
			this.run(["add", "."]);
		}

		return { success: true };
	}

	pull({ rebase = true } = {}) {
		if (!this.hasRemote()) {
			return { success: false, skipped: true, reason: "nenhum remoto configurado" };
		}

		const args = rebase ? ["pull", "--rebase"] : ["pull"];

		this.run(args);

		return { success: true };
	}

	merge(branch) {
		if (!branch) {
			throw new Error('Informe o nome do branch. Exemplo: versioner merge feature/login');
		}

		this.run(["merge", branch]);

		return { success: true };
	}

	commit(message) {
		this.run(["commit", "-m", message]);

		return { success: true };
	}

	push() {
		if (!this.hasRemote()) {
			return { success: false, skipped: true, reason: "nenhum remoto configurado" };
		}

		if (!this.hasUpstream()) {
			const branch = this.branch();

			this.run(["push", "--set-upstream", "origin", branch]);

			return { success: true, upstream: true };
		}

		this.run(["push"]);

		return { success: true };
	}

	tagExists(name) {
		const output = this.query(["tag", "--list", name]);

		return Boolean(output && output.length);
	}

	tag(name, message) {
		if (this.tagExists(name)) {
			return { success: false, skipped: true, reason: "tag já existe" };
		}

		this.run(["tag", "-a", name, "-m", message || name]);

		return { success: true };
	}

	pushTags() {
		if (!this.hasRemote()) {
			return { success: false, skipped: true, reason: "nenhum remoto configurado" };
		}

		this.run(["push", "--tags"]);

		return { success: true };
	}
}

module.exports = GitManager;