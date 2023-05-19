if (!io) var io = require("socket.io-client").io;

const socket = io({ path: "/io", rememberUpgrade: true });
socket.on("reload", () => {
    console.log("Reload");
    location.reload();
});
