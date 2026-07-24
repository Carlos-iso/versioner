const BaseCommand = require("./BaseCommand");

class MajorCommand extends BaseCommand {
	get type() {
		return "major";
	}
}

module.exports = MajorCommand;