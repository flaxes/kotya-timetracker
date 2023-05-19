// @ts-check

const fs = require("fs");

const IGNORE = [".git", "app.db", "package-lock.json", "node_modules", "UPDATE.bat"];

for (const file of fs.readdirSync("./")) {
    fs.rmSync(file, { recursive: true, force: true });
}
