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

	add() {
		this.run(["add", "."]);

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