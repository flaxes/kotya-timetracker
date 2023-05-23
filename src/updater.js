// @ts-check

const fs = require("fs");
const { spawn } = require("child_process");
const createLogger = require("./logger");
const got = require("got-cjs").default;

const UPDATE_URL = "https://raw.githubusercontent.com/flaxes/kotya-timetracker/master/version";
const logger = createLogger("Updater");

class Updater {
    #version;
    #available;
    constructor() {
        this.#version = fs.readFileSync("./version").toString().replace(/\r/g, "").split("\n")[0];
    }

    getVersion() {
        return { version: this.#version, available: this.#available };
    }

    async checkAvailable() {
        this.#available = await got.get(UPDATE_URL, { resolveBodyOnly: true, responseType: "text" }).catch((err) => {
            logger.error(err);

            return "";
        });

        this.#available = this.#available.split("\n")[0];

        return this.#available !== this.#version;
    }

    update() {
        spawn("start", ["cmd.exe", "/c", "UPDATE.bat"], {
            windowsHide: false,
            cwd: "./",
            // stdio: "ignore",
            detached: true,
            shell: "cmd",
        });

        process.exit(0);
    }
}

const updater = new Updater();

module.exports = updater;
