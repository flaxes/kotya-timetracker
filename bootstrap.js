// @ts-check

const { port } = require("./config");
const db = require("./src/db");
const io = require("./src/io");
const createLogger = require("./src/logger");
const server = require("./src/server");
const tracker = require("./src/tracker");
const watcher = require("./src/watcher");
const cron = require("cron");

watcher(io);

const logger = createLogger("App");

async function bootstrap() {
    await db.init();

    await tracker.stopNotFinished();

    new cron.CronJob("0 0 * * *", () => {
        tracker.stopNotFinished().catch((err) => {
            logger.error("On cron tracker clear", err);
        });
    });

    return new Promise((resolve, reject) => {
        const closeError = (err) => {
            reject(err);
        };

        server.on("error", closeError);

        server.listen(port, () => {
            server.removeListener("error", closeError);
            logger.info(`Open http://localhost:${port} in your browser`);
            resolve(port);
        });
    });
}

module.exports = bootstrap;
