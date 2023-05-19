// @ts-check

const db = require("./src/db");
const tracker = require("./src/tracker");

async function test() {
    await db.init();
    await tracker.stopNotFinished().then(console.log);
}

test().catch((err) => console.error(err));
