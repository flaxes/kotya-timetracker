// @ts-check

const fs = require("fs");
const got = require("got-cjs").default;

const UPDATE_URL = ''

class Updater {
    #version;
    #available;
    constructor() {
        this.#version = fs.readFileSync("./version").toString();

        // this.#available = got.get()
    }

    getVersion() {
        return { version: this.#version, available: this.#available };
    }
}

const updater = new Updater();

module.exports = updater;
