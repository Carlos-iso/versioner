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
		return {
			success: true,
		};
	}

	commit(message) {
		this.run(`git commit -m "${message}"`);
		return {
			success: true,
		};
	}

	push() {
		this.run("git push");
		return {
			success: true,
		};
	}
}

module.exports = GitManager;
