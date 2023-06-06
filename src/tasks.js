// @ts-check

const Db = require("./db");
const { DATE_TIME_FORMAT } = require("./helpers");
const history = require("./history");
const moment = require("./moment");
const tracker = require("./tracker");

const STATUS_ENUM = {
    0: "inpause",
    1: "inwork",
    2: "complete",
};

class Tasks {
    /**
     *
     * @returns {Promise<import("../types/db").TaskRow[]>}
     */
    async get(search, statuses) {
        let sql = "SELECT t.*, SUM(tt.wasted_mins) wasted_total_mins FROM tasks t";

        sql += "\nLEFT JOIN task_trackers tt ON tt.task_id = t.id";

        sql += "\nWHERE is_hidden IS NULL";

        const args = [];

        if (search) {
            sql += `\nAND name LIKE ? OR external_id LIKE ?`;
            search += "%";

            args.push(search, search);
        }

        if (statuses && statuses.length) {
            sql += `\nAND status IN (${statuses.join(",")})`;
        }

        sql += "\nGROUP BY t.id";
        sql += "\nORDER BY t.id DESC";

        const res = await Db.get(sql, args);

        return res;
    }

    update(obj) {
        return Db.update(obj, "tasks");
    }

    /**
     *
     * @param {string} name
     * @param {string} external_id
     * @returns {Promise<import("../types/db").TaskRow | { error: string }>}
     */
    async add(name, external_id) {
        const [oldRow] = await Db.get("SELECT * FROM tasks WHERE external_id = ? AND is_hidden IS null", [external_id]);

        if (oldRow) {
            return { error: "duplicate_external_id" };
        }

        const dateTime = moment().format(DATE_TIME_FORMAT);

        /** @type {Partial<import("../types/db").TaskRow>} */
        const obj = {
            name,
            external_id,
            status: 0,
            created_at: dateTime,
        };

        const res = await Db.insertOne(obj, "tasks");

        await history.add("created", res.id);

        return res;
    }

    async hide(id, isHidden = true) {
        const sql = "UPDATE tasks SET is_hidden = ? WHERE id = ?";

        await history.add("deleted", id);

        return Db.run(sql, [isHidden, id]);
    }

    async delete(id) {
        const sql = "DELETE FROM tasks WHERE id = ?";

        const args = [id];

        const promises = [
            Db.run("DELETE FROM tasks WHERE id = ?", args),
            Db.run("DELETE FROM task_trackers WHERE task_id = ?", args),
            Db.run("DELETE FROM logging WHERE task_id = ?"),
        ];

        await Promise.all(promises);

        await history.add("deleted", id);

        const res = await Db.run(sql, [id]);

        return res;
    }

    async changeStatus(id, status) {
        /** @type {import("../types/db").TaskRow[]} */
        const [row] = await Db.get("SELECT * FROM tasks WHERE id = ?", [id]);

        if (row.status === status) throw new Error(`CANNOT UPDATE ${id} TO SAME STATUS`);
        const oldStatus = row.status;

        const newUpdatedAt = moment();

        if (oldStatus === 1) {
            // task was in work
            await tracker.end(id);
        } else if (status === 1) {
            // task moved to in work
            await tracker.start(id);
        }

        row.status = status;
        row.updated_at = newUpdatedAt.format(DATE_TIME_FORMAT);

        const sql = "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?";
        await Db.run(sql, [status, row.updated_at, id]);

        await history.add(`updated_status ${STATUS_ENUM[oldStatus]} -> ${STATUS_ENUM[status]}`, id);

        return row;
    }
}

const tasks = new Tasks();

module.exports = tasks;
