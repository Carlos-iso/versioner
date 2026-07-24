const { root, exists, readJSON, writeJSON } = require("./utils");

class VersionManager {
	constructor() {
		this.file = root(".versioner.json");
	}

	load() {
		if (!exists(this.file)) {
			writeJSON(this.file, {
				major: 0,
				minor: 0,
				build: 0,
			});
		}

		return readJSON(this.file);
	}

	save(version) {
		writeJSON(this.file, version);
	}

	toString(version) {
		return `${version.major}.${version.minor}.${version.build}`;
	}

	increment(type) {
		const version = this.load();

		const previous = { ...version };

		const previousVersion = this.toString(previous);

		switch (type) {
			case "build":
				version.build++;
				break;

			case "minor":
				version.minor++;
				version.build++;
				break;

			case "major":
				version.major++;
				version.minor = 0;
				version.build++;
				break;

			default:
				throw new Error("Tipo de versão inválido.");
		}

		this.save(version);

		return {
			previousVersion,

			currentVersion: this.toString(version),

			previous,

			current: version,
		};
	}
}

module.exports = VersionManager;
