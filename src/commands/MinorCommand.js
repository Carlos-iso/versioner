const BaseCommand = require("./BaseCommand");

class MinorCommand extends BaseCommand {
	get type() {
		return "minor";
	}
}

module.exports = MinorCommand;