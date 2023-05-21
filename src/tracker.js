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
        const todayDate = m.format(DATE_FORMAT);

        const getSql = "SELECT * FROM task_trackers WHERE ended_at IS null AND DATE(started_at) != ?";

        /** @type {import("../types/db").TaskTrackRow[]} */
        const tasks = await Db.get(getSql, [todayDate]);

        if (!tasks.length) return;

        const sql = "UPDATE task_trackers SET ended_at = ?, wasted_mins = ? WHERE id = ?";

        const endTasksIds = new Set();
        const finishPromises = tasks.map((item) => {
            const to = moment(item.started_at).set({ h: 0, m: 0, s: 0 }).add(1, "day");
            const zeroTime = to.format(DATE_TIME_FORMAT);
            const wastedMins = this.calculateWastedMins(moment(item.started_at), to);

            endTasksIds.add(item.task_id);
            return Db.run(sql, [zeroTime, wastedMins, item.id]);
        });

        await Promise.all(finishPromises);

        const sqlTasks = "UPDATE tasks SET status = 0 WHERE id IN (?) AND status = 1";

        const toFinish = Array.from(endTasksIds);
        await Db.run(sqlTasks, [toFinish.join(",")]);

        await Promise.all(toFinish.map((taskId) => history.add("force_end", taskId)));

        logger.warn(`${endTasksIds.size} tasks forced finished`);
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
        WHERE tt.started_at >= ? AND tt.started_at <= ? ORDER BY tt.started_at ASC`;

        const res = await Db.get(sql, [dateFrom, dateTo]);

        return res;
    }

    /**
     *
     * @param {number} taskId
     * @returns {Promise<import("../types/db").TaskTrackRow | undefined>}
     */
    async getInworkByTaskId(taskId) {
        const sql = "SELECT * FROM task_trackers WHERE task_id = ? AND ended_at IS null ORDER BY id DESC LIMIT 1";

        const res = await Db.get(sql, [taskId]);

        return res[0];
    }

    /**
     *
     * @param {Partial<import("../types/db").TaskTrackRow>} track
     * @param {boolean} [skipHistory]
     */
    async create(track, skipHistory) {
        if (!track.task_id) throw new Error("TaskID is required");

        if (!track.wasted_mins && track.ended_at && track.started_at) {
            track.wasted_mins = this.calculateWastedMins(moment(track.started_at), moment(track.ended_at));
        }

        const res = await Db.insertOne(track, "task_trackers");

        if (!skipHistory) await history.add("track_created", track.task_id);

        return res;
    }

    /**
     *
     * @param {number} taskId
     */
    async start(taskId) {
        /** @type {Partial<import("../types/db").TaskTrackRow>} */
        const track = {
            task_id: taskId,
            started_at: moment().format(DATE_TIME_FORMAT),
            wasted_mins: 0,
        };

        const res = await this.create(track, true);

        return res;
    }

    async end(taskId) {
        const row = await this.getInworkByTaskId(taskId);

        if (!row || row.ended_at) return;

        const endedAt = moment();

        row.ended_at = endedAt.format(DATE_TIME_FORMAT);
        row.wasted_mins = this.calculateWastedMins(moment(row.started_at), endedAt);

        if (row.wasted_mins < 1) {
            // Delete useless tasks
            await Db.run("DELETE FROM task_trackers WHERE id = ?", [row.id]);

            return;
        }

        const sql = "UPDATE task_trackers SET ended_at = ?, wasted_mins = ? WHERE id = ?";
        await Db.run(sql, [row.ended_at, row.wasted_mins, row.id]);

        return row;
    }

    async update(taskId, trackId, from, to) {
        const sql =
            "UPDATE task_trackers SET wasted_mins = ?, started_at = ?, ended_at = ? WHERE id = ? AND task_id = ?";
        const diff = moment(to).diff(moment(from), "minutes");

        const args = [diff, from, to, trackId, taskId];

        const res = await Db.run(sql, args);

        await history.add("track_updated", taskId);

        return { diff };
    }

    async delete(taskId, trackId) {
        const sql = "DELETE FROM task_trackers WHERE id = ? AND task_id = ?";

        const res = await Db.run(sql, [trackId, taskId]);

        await history.add("track_deleted", taskId);

        return res;
    }

    /**
     *
     * @param {moment.Moment} from
     * @param {moment.Moment} to
     */
    calculateWastedMins(from, to) {
        return to.diff(from, "minutes");
    }
}

const tracker = new Tracker();

module.exports = tracker;
