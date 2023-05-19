// @ts-check

const sqlite = require("sqlite");
const { Statement, Database } = require("sqlite3");

class Db {
    /** @type {sqlite.Database<Database, Statement>} */
    #db;

    async init() {
        const db = await sqlite.open({ driver: Database, filename: "./app.db" });

        this.#db = db;
    }
    async get(sql, values) {
        const res = await this.#db.all(sql, values);
        if (res[0] && !res[0].id) return [];

        return res;
    }

    run(sql, values) {
        return this.#db.run(sql, values);
    }

    /**
     *
     * @param {object} obj
     * @param {string} table
     * @returns
     */
    async insertOne(obj, table) {
        const entries = Object.entries(obj);

        const columns = [];
        const values = [];

        entries.forEach(([key, value]) => {
            columns.push(key);
            values.push(value);
        });

        const sql = `INSERT INTO ${table} (${columns.join(",")}) VALUES (${Array(values.length).fill("?").join(",")})`;

        const res = await this.#db.run(sql, values);
        obj.id = res.lastID;

        return obj;
    }
}

const db = new Db();

module.exports = db;
