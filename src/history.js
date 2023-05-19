// @ts-check

const Db = require("./db");
const { DATE_TIME_FORMAT } = require("./helpers");
const moment = require("./moment");

class History {
    /**
     *
     * @returns {Promise<import("../types/db").LoggingRow[]>}
     */
    async get() {
        let sql = "SELECT l.*,t.external_id FROM logging l";

        sql += "\nINNER JOIN tasks t ON t.id = l.task_id";
        sql += "\nORDER BY l.id DESC";

        const res = await Db.get(sql);

        return res;
    }

    /**
     *
     * @param {string} text
     * @param {number} taskId
     * @returns {Promise<import("../types/db").LoggingRow>}
     */
    async add(text, taskId) {
        /** @type {Partial<import("../types/db").LoggingRow>} */
        const obj = {
            text,
            task_id: taskId,
            created_at: moment().format(DATE_TIME_FORMAT),
        };

        const res = await Db.insertOne(obj, "logging");

        return res;
    }
}

const history = new History();

module.exports = history;
