class Logger {

    title(text) {

        console.log("\n================================");

        console.log(text);

        console.log("================================");

    }

    info(text) {

        console.log("ℹ", text);

    }

    success(text) {

        console.log("✔", text);

    }

    error(text) {

        console.log("✖", text);

    }

}

module.exports = new Logger();