const {

    root,
    exists,
    readJSON,
    writeJSON,
    setValue

} = require("./utils");

class FileManager {

    update(file, version) {

        const filepath = root(file.path);

        if (!exists(filepath)) {

            return false;

        }

        const json = readJSON(filepath);

        setValue(
            json,
            file.field,
            version
        );

        writeJSON(
            filepath,
            json
        );

        return true;

    }

}

module.exports = FileManager;