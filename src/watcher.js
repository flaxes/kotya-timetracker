// @ts-check
const fs = require("fs");

/**
 *
 * @param {import('socket.io').Server} socketServer
 */
const watcher = (socketServer) => {
    let timeout = null;

    const cb = (event, fileName) => {
        if (timeout) return;

        if (!fileName || event !== "change") return;

        timeout = setTimeout(() => (timeout = null), 2e3);

        console.log(`${event} ${fileName} changed`);
        socketServer.emit("reload");
    };

    /** @type {fs.WatchOptions} */
    const options = { encoding: "utf8", recursive: true, persistent: true };

    fs.watch("./src", options, cb);
    fs.watch("./public", options, cb);
    fs.watch("./langs", options, cb);
};

module.exports = watcher;
