const { execSync } = require("child_process");

class GitManager {
	run(command) {
		execSync(command, {
			cwd: process.cwd(),

			stdio: "inherit",
		});
	}

	add() {
		this.run("git add .");
	}

	commit(message) {
		this.run(`git commit -m "${message}"`);
	}

	push() {
		this.run("git push");
	}
}

module.exports = GitManager;
