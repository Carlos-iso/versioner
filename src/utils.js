const fs = require("fs");
const path = require("path");

function root(...paths) {
	return path.join(process.cwd(), ...paths);
}

function exists(file) {
	return fs.existsSync(file);
}

function readJSON(file) {
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

function setValue(object, path, value) {
	const keys = path.split(".");

	let current = object;

	while (keys.length > 1) {
		const key = keys.shift();

		if (!(key in current)) {
			current[key] = {};
		}

		current = current[key];
	}

	current[keys[0]] = value;
}

module.exports = {
	root,
	exists,
	readJSON,
	writeJSON,
	setValue,
};
