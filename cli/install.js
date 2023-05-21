// @ts-check

const fs = require("fs");

if (!fs.existsSync("./app.db")) fs.copyFileSync("./app_example.db", "./app.db");
if (!fs.existsSync("./config.js")) fs.copyFileSync("./config_example.js", "./config.js");
