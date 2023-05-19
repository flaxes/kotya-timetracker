// @ts-check

const Db = require("./db");
const { DATE_TIME_FORMAT, DATE_FORMAT, WEEK_FORMAT } = require("./helpers");
const history = require("./history");
const createLogger = require("./logger");
const moment = require("./moment");

const logger = createLogger("Tracker");

class Tracker {
    async stopNotFinished() {
        const m = moment().set({ h: 0, m: 0, s: 0 });
        const zeroTime = m.format(DATE_TIME_FORMAT);
        const date = m.format(DATE_FORMAT);

        const getSql = "SELECT * FROM task_trackers WHERE ended_at IS null AND DATE(started_at) != ?";
        const tasks = await Db.get(getSql, [date]);

        if (!tasks.length) return;

        const sql = "UPDATE task_trackers SET ended_at = ? WHERE id IN (?)";

        const endTasksIds = [];
        const endIds = tasks.map((item) => {
            endTasksIds.push(item.task_id);
            return item.id;
        });
        const res = await Db.run(sql, [zeroTime, endIds.join(",")]);

        await Promise.all(tasks.map((task) => history.add("force_end", task.task_id)));

        const sqlTasks = "UPDATE tasks SET status = 0 WHERE id IN (?) AND status = 1";

        await Db.run(sqlTasks, [endTasksIds.join(",")]);
        logger.warn(`${res.changes} tasks forced finished`);

        return res;
    }
    /**
     *
     * @returns {Promise<import("../types/db").LoggingRow[]>}
     */
    async get(week) {
        const m = moment(week, WEEK_FORMAT);

        m.set({ s: 0, h: 0, m: 0 });

        const dateFrom = m.format(DATE_TIME_FORMAT);
        const dateTo = m.add({ days: 7 }).format(DATE_TIME_FORMAT);

        const sels = [
            "t.name",
            "t.external_id",
            "tt.id",
            "tt.started_at",
            "tt.ended_at",
            "tt.task_id",
            "tt.wasted_mins",
        ];

        const sql = `SELECT ${sels.join(",")} FROM task_trackers tt
        INNER JOIN tasks t ON t.id = tt.task_id
        WHERE tt.started_at >= ? AND tt.started_at <= ? ORDER BY tt.id ASC`;

        const res = await Db.get(sql, [dateFrom, dateTo]);

        return res;
    }

    /**
     *
     * @param {number} taskId
     * @returns {Promise<import("../types/db").TaskTrackRow | undefined>}
     */
    async getByTaskId(taskId) {
        const sql = "SELECT * FROM task_trackers WHERE task_id = ? ORDER BY id DESC";

        const res = await Db.get(sql, [taskId]);

        return res[0];
    }

    /**
     *
     * @param {number} taskId
     */
    async start(taskId) {
        /** @type {Partial<import("../types/db").TaskTrackRow>} */
        const obj = {
            task_id: taskId,
            started_at: moment().format(DATE_TIME_FORMAT),
            wasted_mins: 0,
        };

        const res = await Db.insertOne(obj, "task_trackers");

        return res;
    }

    async end(taskId) {
        const row = await this.getByTaskId(taskId);

        if (!row || row.ended_at) return;

        const endedAt = moment();

        row.ended_at = endedAt.format(DATE_TIME_FORMAT);
        row.wasted_mins = moment(row.started_at).diff(endedAt, "minutes");

        if (row.wasted_mins) {
            // Delete useless tasks
            await Db.run("DELETE FROM task_trackers WHERE id = ?", [row.id]);

            return;
        }

        const sql = "UPDATE task_trackers SET ended_at = ?, wasted_mins = ? WHERE id = ?";
        await Db.run(sql, [row.ended_at, row.wasted_mins, row.id]);

        await history.add("ended", taskId);

        return row;
    }

    async update(trackId, from, to) {
        const sql = "UPDATE task_trackers SET wasted_mins = ?, started_at = ?, ended_at = ? WHERE id = ?";
        const diff = moment(to).diff(moment(from), "minutes");

        const args = [diff, from, to, trackId];

        const res = await Db.run(sql, args);

        return { diff } ;
    }

    delete(trackId) {
        const sql = "DELETE FROM task_trackers WHERE id = ?";

        return Db.run(sql, [trackId]);
    }
}

const tracker = new Tracker();

module.exports = tracker;
