const BaseCommand = require("./BaseCommand");

class BuildCommand extends BaseCommand {
	get type() {
		return "build";
	}
}

module.exports = BuildCommand;