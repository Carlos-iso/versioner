const CommandRouter = require("./services/CommandRouter");
const logger = require("./utils/logger");

async function main() {
	const router = new CommandRouter();

	const code = await router.run(process.argv.slice(2));

	process.exit(code || 0);
}

main().catch((error) => {
	logger.break();
	logger.error(error.message);

	if (process.env.VERSIONER_DEBUG) {
		console.error(error);
	}

	process.exit(1);
});