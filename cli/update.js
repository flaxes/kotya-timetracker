// @ts-check

const fs = require("fs");

const IGNORE = [".git", "app.db", "package-lock.json", "node_modules", "UPDATE.bat", "_temp"];
const UPDATED_DIR = "./_temp/kotya-timetracker-master";

for (const file of fs.readdirSync("./")) {
    if (IGNORE.includes(file)) continue;
    fs.rmSync(file, { recursive: true, force: true });
}

for (const file of fs.readdirSync(UPDATED_DIR)) {
    console.log(file);
    fs.renameSync(`${UPDATED_DIR}/${file}`, `./${file}`);
}

fs.rmSync("./_temp", { recursive: true });
