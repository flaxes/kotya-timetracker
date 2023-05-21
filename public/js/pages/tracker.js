// @ts-check
/// <reference path="../helpers.js" />
if (!moment) var moment = require("moment");

const WEEKDAY = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
    0: "sunday",
};
const WEEK_FORMAT = "YYYY-[W]WW";

function createDateInput(date) {
    const input = document.createElement("input");
    input.type = "time";
    input.className = "task-time";

    if (date) input.value = getTimeFromDate(date);

    return input;
}

let totalCounterLastId = 1;
class TotalCounter {
    /**
     *
     * @param {{ innerText?: string }} el
     * @param {TotalCounter} [parent]
     */
    constructor(el, parent) {
        this.data = {};
        this.el = el;
        this.parent = parent;

        this.id = totalCounterLastId++;
    }

    calc() {
        return Object.values(this.data).reduce((a, b) => a + b, 0);
    }

    update() {
        const sum = this.calc();

        if (sum) {
            this.el.innerText = minutesToSummary(sum);
        } else {
            this.el.innerText = "0m";
        }

        if (this.parent) {
            this.parent.change(this.id, sum);
        }
    }

    change(key, num) {
        this.data[key] = num || 0;

        this.update();
    }
}

/**
 *
 * @param {Partial<import("../../../types/db").TaskTrackRow>} num
 * @param {TotalCounter} taskCounter
 * @param {number} counter
 */
function renderNum(num, taskCounter, counter) {
    const numDom = createElementWithText("div", "", "task-time-start");

    numDom.append(createElementWithText("span", `${counter}.`, "task-counter"));

    const fromInput = createDateInput(num.started_at);
    numDom.append(fromInput);

    numDom.append(createElementWithText("span", "-"));

    const toInput = createDateInput(num.ended_at);
    numDom.append(toInput);

    const saveButton = createElementWithText("button", "s", "task-time-save");
    const deleteButton = createElementWithText("button", "x", "task-time-delete");
    const { dom: numTotalDom, total: numTotal } = renderSummary("wasted_per_start_dt", taskCounter);

    saveButton.onclick = async () => {
        // Disallow to save without times
        if (!fromInput.value || !toInput.value) return;

        if (moment(fromInput.value, TIME_FORMAT).isAfter(moment(toInput.value, TIME_FORMAT))) {
            return;
        }

        const date = (num.started_at || new Date().toISOString()).slice(0, 10);

        // Update case
        if (num.id) {
            const body = {
                from: `${date} ${fromInput.value}:00`,
                taskId: num.task_id,
                trackId: num.id,
            };

            if (toInput.value) body.to = `${date} ${toInput.value}:00`;

            await request("/tracker/update", "POST", body)
                .then((res) => {
                    numTotal.change(num.id, res.diff);
                })
                .catch((err) => {
                    console.error(err);

                    alert(err.message);
                });

            return;
        }

        // Create case
        const body = {
            taskId: num.task_id,
            from: `${date} ${fromInput.value}:00`,
        };

        if (toInput.value) body.to = `${date} ${toInput.value}:00`;

        await request("/tracker/create", "POST", body)
            .then((res) => {
                num.id = res.id;
                numTotal.change(num.id, res.wasted_mins);
            })
            .catch((err) => {
                console.error(err);

                alert(err.message);
            });
    };

    deleteButton.onclick = async () => {
        const isConfirmed = confirm(L("are_you_sure", "C", 1));

        if (!isConfirmed) return;

        if (num.id) {
            await request("/tracker/delete", "POST", { trackId: num.id, taskId: num.task_id })
                .then(() => {})
                .catch((err) => {
                    console.error(err);

                    alert(err.message);
                });
        }

        deleteButton.parentElement.remove();
        numTotal.change(num.id, 0);
    };

    numDom.append(saveButton);
    numDom.append(deleteButton);

    numDom.append(numTotalDom);
    numTotal.change(num.id, num.wasted_mins);

    return numDom;
}

/**
 *
 * @param {object} nums
 * @param {TotalCounter} taskCounter
 * @returns
 */
function renderNums(nums, taskCounter) {
    const taskStarts = createElementWithText("div", "", "task-time-starts");

    taskStarts.dataset.counter = 0;

    for (const num of nums) {
        if (!num.ended_at || !num.wasted_mins) continue;

        const count = (Number(taskStarts.dataset.counter) || 0) + 1;

        taskStarts.dataset.counter = count;
        const numDom = renderNum(num, taskCounter, count);

        taskStarts.append(numDom);
    }

    return taskStarts;
}

/**
 *
 * @param {number} taskId
 * @param {TotalCounter} taskCounter
 * @param {HTMLElement} taskStartsDom
 * @returns
 */
function renderAddNumBtn(taskId, taskCounter, taskStartsDom) {
    const btn = createElementWithText("button", "+", "task-time-starts-add");

    btn.onclick = () => {
        const count = (Number(taskStartsDom.dataset.counter) || 0) + 1;

        taskStartsDom.dataset.counter = count + "";
        const createNum = renderNum({ task_id: taskId }, taskCounter, count);

        taskStartsDom.append(createNum);
    };
    return btn;
}

/**
 *
 * @param {'wasted_per_task_dt' | 'wasted_per_day_dt' | 'wasted_per_start_dt'} text
 * @param {TotalCounter} [parent]
 * @returns
 */
function renderSummary(text, parent) {
    const dom = createElementWithText("div", "", "summary");
    const total = new TotalCounter(createElementWithText("span", "", "summary-num"), parent);

    dom.append(createElementWithText("span", L(text, "C"), "summary-text"));
    dom.append(total.el);

    return { dom, total };
}

/**
 *
 * @param {string} date
 * @param {Record<number, import("../../../types/db").TaskTrackRow[]>} tracks
 */
function renderDay(date, tracks) {
    const weekDayDom = createElementWithText("div", "", "week-day");

    const weekDayInfo = createElementWithText("div", "", "week-day-title");
    weekDayDom.append(weekDayInfo);

    const weekdayName = L(WEEKDAY[moment(date, DATE_FORMAT).weekday()], "C");

    weekDayInfo.append(createElementWithText("span", weekdayName, "week-day-name"));
    weekDayInfo.append(createElementWithText("span", date, "week-day-date"));

    const { dom, total } = renderSummary("wasted_per_day_dt");

    for (const [id, nums] of Object.entries(tracks)) {
        if (!nums[0]) {
            console.warn("skipped id", id, tracks);
            continue;
        }

        const { dom: dayDom, total: dayTotal } = renderSummary("wasted_per_task_dt", total);

        // Pick first row for all data
        const { name, external_id } = nums[0];
        const taskDom = createElementWithText("div", "", "task");

        taskDom.dataset.id = id;

        const taskTitle = L(`id_dt ${id} | external_id ${external_id}`, "U");

        taskDom.append(createElementWithText("div", taskTitle, "task-title"));
        taskDom.append(createElementWithText("div", name, "task-name"));
        weekDayDom.append(taskDom);

        const taskStarts = renderNums(nums, dayTotal);
        taskDom.append(taskStarts);

        taskDom.append(dayDom);
        taskDom.append(renderAddNumBtn(Number(id), dayTotal, taskStarts));
    }

    weekDayDom.append(dom);
    total.update();

    return weekDayDom;
}

async function renderTracker(currentWeek) {
    /** @type {import("../../../types/db").TaskTrackRow[]} */
    const res = await request("/tracker", "GET", { week: currentWeek });
    const trackerDom = q("#week-tracker");

    let day = "";
    /** @type {Record<string, Record<number, import("../../../types/db").TaskTrackRow[]>>} */
    const weekdayTracks = {};
    /** @type {Record<number, import("../../../types/db").TaskTrackRow[]>} */
    let tracks = {};

    const monday = moment(currentWeek, WEEK_FORMAT);

    weekdayTracks[monday.format(DATE_FORMAT)] = {};

    for (let i = 0; i < 6; i++) {
        weekdayTracks[monday.add(1, "d").format(DATE_FORMAT)] = {};
    }

    for (const track of res) {
        const newDay = moment(track.started_at).format(DATE_FORMAT);
        if (day !== newDay) {
            day = newDay;
            tracks = {};

            weekdayTracks[day] = tracks;
        }

        const taskTracking = tracks[track.task_id] || (tracks[track.task_id] = []);

        taskTracking.push(track);
    }

    for (const date in weekdayTracks) {
        trackerDom.append(renderDay(date, weekdayTracks[date]));
    }
}

async function start() {
    const currentWeek = SEARCH.get("week") || moment().format(WEEK_FORMAT);

    const m = moment(currentWeek);

    const searchWeek = q("#search-week");
    const doSearch = () => {
        const val = searchWeek.value;

        refreshWithNewSearch("week", val);
    };

    searchWeek.value = currentWeek;

    // q(".tracker-search-action").onclick = doSearch;
    searchWeek.onchange = doSearch;

    const changeWeek = (num) => () => {
        m.add({ week: num });

        searchWeek.value = m.format(WEEK_FORMAT);
        doSearch();
    };

    q(".search-prev").onclick = changeWeek(-1);
    q(".search-next").onclick = changeWeek(1);

    /* dom.querySelector('[name="first"]').onclick = () => {
        document.location.href = "/?page=1";
    };

    dom.querySelector('[name="last"]').onclick = () => {
        document.location.href = `/?page=${currentWeek}`;
    };

    if (currentWeek > 1) {
        dom.querySelector('[name="prev"]').onclick = () => {
            document.location.href = `/?page=${currentWeek - 1}`;
        };
    }

    if (currentWeek < currentWeek) {
        dom.querySelector('[name="next"]').onclick = () => {
            document.location.href = `/?page=${currentWeek + 1}`;
        };
    } */

    await renderTracker(currentWeek);
}
