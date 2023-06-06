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

class Tracker {
    constructor() {
        this.visibleTasks = [];
        this.visibleTasksList = {};
    }
    /**
     *
     * @param {Partial<import("../../../types/db").TaskTrackRow>} num
     * @param {TotalCounter} taskCounter
     * @param {number} counter
     */
    renderNum(num, taskCounter, counter) {
        const numDom = createElementWithText("div", "", "task-time-start");

        numDom.append(createElementWithText("span", `${counter}.`, "task-counter"));

        const fromInput = createDateInput(num.started_at);
        numDom.append(fromInput);

        numDom.append(createElementWithText("span", "-"));

        const toInput = createDateInput(num.ended_at);
        numDom.append(toInput);

        const saveButton = createElementWithText("button", "s", "task-time-save");
        const deleteButton = createElementWithText("button", "x", "task-time-delete");
        const { dom: numTotalDom, total: numTotal } = this.renderSummary("wasted_per_start_dt", taskCounter);

        saveButton.onclick = async () => {
            // Disallow to save without times
            if (!fromInput.value || !toInput.value) return;

            if (moment(fromInput.value, TIME_FORMAT).isAfter(moment(toInput.value, TIME_FORMAT))) {
                return;
            }

            console.log(num);

            const date = (num.started_at || new Date().toISOString()).slice(0, 10);

            // Update case
            if (num.id) {
                const body = {
                    from: `${date} ${fromInput.value}:00`,
                    taskId: num.task_id,
                    trackId: num.id,
                };

                if (toInput.value) body.to = `${date} ${toInput.value}:00`;

                await request("tracker/update", "POST", body)
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

            await request("tracker/create", "POST", body)
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
                await request("tracker/delete", "POST", { trackId: num.id, taskId: num.task_id })
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
    renderNums(nums, taskCounter) {
        const taskStarts = createElementWithText("div", "", "task-time-starts");

        taskStarts.dataset.counter = 0;

        for (const num of nums) {
            if (!num.ended_at || !num.wasted_mins) continue;

            const count = (Number(taskStarts.dataset.counter) || 0) + 1;

            taskStarts.dataset.counter = count;
            const numDom = this.renderNum(num, taskCounter, count);

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
    renderAddNumBtn(taskId, taskCounter, taskStartsDom) {
        const btn = createElementWithText("button", "+", "task-time-starts-add");

        console.log(taskStartsDom);

        btn.onclick = () => {
            const count = (Number(taskStartsDom.dataset.counter) || 0) + 1;
            // @ts-ignore
            const started_at = taskStartsDom.parentElement.parentElement.dataset.date || new Date().toISOString();

            taskStartsDom.dataset.counter = count + "";
            const createNum = this.renderNum({ task_id: taskId, started_at }, taskCounter, count);

            taskStartsDom.append(createNum);
        };

        return btn;
    }

    renderAddDayTaskBtn(weekDayDom, total) {
        const addTaskDom = createElementWithText("div", "", "task-add");

        const select = createElementWithText("select", "", "task-add-select");
        const btn = createElementWithText("button", "+", "task-time-starts-add");

        btn.onclick = () => {
            const selected = select.options[select.selectedIndex];
            if (!selected) return;

            const newTask = this.visibleTasksList[selected.dataset.id];

            const newTaskDom = this.renderTask(newTask, [], total);
            selected.remove();

            if (!select.options.length) {
                addTaskDom.hidden = true;
            }

            weekDayDom.append(newTaskDom);
        };

        addTaskDom.append(select);
        addTaskDom.append(btn);
        addTaskDom.hidden = true;

        return addTaskDom;
    }

    /**
     *
     * @param {'wasted_per_task_dt' | 'wasted_per_day_dt' | 'wasted_per_start_dt'} text
     * @param {TotalCounter} [parent]
     * @returns
     */
    renderSummary(text, parent) {
        const dom = createElementWithText("div", "", "summary");
        const total = new TotalCounter(createElementWithText("span", "", "summary-num"), parent);

        dom.append(createElementWithText("span", L(text, "C"), "summary-text"));
        dom.append(total.el);

        return { dom, total };
    }

    renderTask(task, nums, total) {
        const { dom: dayDom, total: dayTotal } = this.renderSummary("wasted_per_task_dt", total);

        // Pick first row for all data
        const { name, external_id, id } = task;
        const taskDom = createElementWithText("div", "", "task");

        taskDom.dataset.id = id;

        const taskTitle = L(`id_dt ${id} | external_id ${external_id}`, "U");

        taskDom.append(createElementWithText("div", taskTitle, "task-title"));

        const taskNameDom = createElementWithText("div", name, "task-name");
        /* const taskNameDom = createElementWithText("textarea", void 0, "value-max");
        taskNameDom.value = name;
        taskNameDom.readOnly = true; */

        taskDom.append(taskNameDom);

        const taskStarts = this.renderNums(nums, dayTotal);
        taskDom.append(taskStarts);

        taskDom.append(dayDom);
        taskDom.append(this.renderAddNumBtn(Number(id), dayTotal, taskStarts));

        return taskDom;
    }

    /**
     *
     * @param {string} date
     * @param {Record<number, import("../../../types/db").TaskTrackRow[]>} tracks
     */
    renderDay(date, tracks) {
        const weekdayName = L(WEEKDAY[moment(date, DATE_FORMAT).weekday()], "C");

        const { dom, total } = this.renderSummary("wasted_per_day_dt");
        const weekDayDom = createElementWithText("div", "", "week-day");
        const weekDayInfo = createElementWithText("div", "", "week-day-title");

        const addDayTaskDom = this.renderAddDayTaskBtn(weekDayDom, total);
        const addDayTaskList = {};

        weekDayDom.append(weekDayInfo);
        weekDayInfo.append(createElementWithText("span", weekdayName, "week-day-name"));
        weekDayInfo.append(createElementWithText("span", date, "week-day-date"));
        weekDayDom.append(addDayTaskDom);

        for (const [id, nums] of Object.entries(tracks)) {
            if (!nums[0]) {
                console.warn("skipped id", id, tracks);
                continue;
            }

            const { external_id, name } = nums[0];

            const task = { id, external_id, name };

            const taskDom = this.renderTask(task, nums, total);

            addDayTaskList[id] = true;

            weekDayDom.append(taskDom);
        }

        if (this.visibleTasks) {
            const selectDom = addDayTaskDom.querySelector("select");

            this.visibleTasks.forEach((item) => {
                // Tasks already exists on day dom
                if (addDayTaskList[item.id]) return;

                addDayTaskDom.hidden = false;
                const txt = item.name.slice(0, 100);

                const option = createElementWithText("option", txt, "task-add-option");
                option.dataset.id = item.id;

                selectDom.append(option);
            });
        }

        weekDayDom.append(dom);
        total.update();

        return weekDayDom;
    }

    async render(currentWeek) {
        /** @type {import("../../../types/db").TaskTrackRow[]} */
        const res = await request("tracker", "GET", { week: currentWeek });
        const tasksInPause = await request("tasks", "GET", { status: 0 });
        this.visibleTasks = tasksInPause;
        this.visibleTasksList = {};
        this.visibleTasks.forEach((item) => {
            this.visibleTasksList[item.id] = item;
        });

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
            const dayDom = this.renderDay(date, weekdayTracks[date]);
            dayDom.dataset.date = moment(date, DATE_FORMAT).format(DATE_ISO_FORMAT);
            trackerDom.append(dayDom);
        }
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

    const tracker = new Tracker();

    await tracker.render(currentWeek);
}
