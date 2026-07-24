const path = require("path");

function root(...paths) {

    return path.join(process.cwd(), ...paths);

}

module.exports = {

    root

};