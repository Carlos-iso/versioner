const ReleaseManager = require("./ReleaseManager");

const args = process.argv.slice(2);

const context = {
    type: args[0],
    message: args.slice(1).join(" "),
    cwd: process.cwd(),
    version: null,
    previousVersion: null,
    config: null
};

const release = new ReleaseManager();

release.run(context);