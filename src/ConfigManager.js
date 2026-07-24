const {
    root,
    exists,
    readJSON
} = require("./utils");

class ConfigManager {

    constructor() {

        this.file = root("versioner.config.json");

    }

    load() {

        if (!exists(this.file)) {

            throw new Error(
                "Arquivo versioner.config.json não encontrado."
            );

        }

        return readJSON(this.file);

    }

}

module.exports = ConfigManager;