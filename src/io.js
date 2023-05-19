// @ts-check

const IO = require("socket.io");
const server = require("./server");

const io = new IO.Server(server, { path: "/io" });

module.exports = io;
