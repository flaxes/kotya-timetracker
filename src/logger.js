// @ts-check

const getColor = require("./get-color");

class Logger {
    constructor(namespace) {
        this._namespace = namespace;
    }

    log(type, color, ...msgs) {
        const date = new Date().toLocaleString("ru-RU");
        return console[type](getColor(color, `[${date}]`), `[${type}]`, ...msgs);
    }

    info(...msgs) {
        return this.log("info", "FgCyan", ...msgs);
    }

    warn(...msgs) {
        return this.log("warn", "FgYellow", ...msgs);
    }

    error(...msgs) {
        return this.log("error", "FgRed", ...msgs);
    }

    debug(...msgs) {
        return this.log("debug", "FgBlue", ...msgs);
    }
}

const loggers = {};

/**
 *
 * @param {string} namespace
 * @returns {Logger}
 */
function createLogger(namespace) {
    namespace = namespace.toUpperCase();
    if (!loggers[namespace]) {
        const logger = new Logger(namespace);
        loggers[namespace] = logger;
        logger.debug(`Logger ${namespace} created`);
    }
    return loggers[namespace];
}

module.exports = createLogger;
