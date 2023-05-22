// @ts-check
/// <reference path="../helpers.js" />
if (!moment) var moment = require("moment");

function getStatusEnum() {
    const TASK_STATUS = {
        0: L("pause", "C"),
        1: L("begin", "C"),
        2: L("end", "C"),
    };

    return TASK_STATUS;
}

const tasksGroups = {
    0: q('[data-status="0"] .tasks'),
    1: q('[data-status="1"] .tasks'),
    2: q('[data-status="2"] .tasks'),
};

async function updateTaskStatus(id, status) {
    const res = await request("/tasks/status", "POST", { id, status });

    return res;
}

/**
 *
 * @param {import("../../../types/db").TaskRow} task
 */
function renderTask(task) {
    const updateNameButton = (id, valueEl) => {
        const btn = createElementWithText("button", "s", "value-save");

        btn.onclick = () => {
            const isConfirmed = confirm(L("are_you_sure", "C", 1));

            if (!isConfirmed) return;

            request("/tasks/update", "POST", { id, name: valueEl.value }).catch((err) => {
                console.error(err);

                alert(err.message);
            });
        };

        const recalculateHeight = () => {
            // valueEl.style.height = `${calcHeight(valueEl.value)}px`;
            valueEl.style.height = "auto";

            // const height = valueEl.scrollHeight ? valueEl.scrollHeight + 10 : Math.floor(valueEl.value.length / 4);

            const height = valueEl.scrollHeight  +10;
            valueEl.style.height = `${height > 10 ? height : 16}px`;
        };

        valueEl.addEventListener("keydown", recalculateHeight);
        valueEl.addEventListener("click", recalculateHeight);

        return btn;
    };

    const table = [
        { name: "id", trans: "id_dt" },
        { name: "external_id", trans: "external_id" },
        {
            name: "name",
            trans: "name_dt",
            type: "textarea",
            value: "value",
            valueClass: "value-max",
            button: updateNameButton,
        },
        {
            name: "created_at",
            trans: "created_dt",
            format: (val) => {
                return moment(val).format(DATE_TIME_FORMAT);
            },
        },
        {
            name: "updated_at",
            trans: "updated_dt",
            format: (val) => {
                return moment(val).format(DATE_TIME_FORMAT);
            },
        },
        {
            name: "wasted_total_mins",
            trans: "wasted_dt",
            format: (val) => {
                return minutesToSummary(val);
            },
        },
    ];

    const STATUS_ENUM = getStatusEnum();

    const createButton = (status) => {
        const button = document.createElement("button");
        button.className = "task-action";

        button.innerText = STATUS_ENUM[status];

        button.onclick = async () => {
            const res = await updateTaskStatus(task.id, status);

            // @ts-ignore
            button.parentElement.parentElement.remove();
            console.log(tasksGroups[status]);
            tasksGroups[status].prepend(renderTask(res));
        };

        return button;
    };

    const createButtons = () => {
        const group = document.createElement("div");
        group.className = "task-actions";

        for (const statusKey in STATUS_ENUM) {
            const status = ~~statusKey;

            if (status !== task.status) {
                group.appendChild(createButton(status));
            }
        }

        return group;
    };

    const createDeleteButton = (id) => {
        const btn = document.createElement("button");
        btn.innerText = "X";
        btn.className = "task-delete";

        btn.onclick = (e) => {
            const isConfirm = confirm(L("are_you_sure", "C", 1));

            if (!isConfirm) return;

            request("/tasks/delete", "POST", { id })
                .then(() => {
                    // @ts-ignore
                    btn.parentElement.parentElement.remove();
                })
                .catch((err) => {
                    console.error(err);

                    alert(err.message);
                });
        };

        return btn;
    };

    const createColumn = (type, val, inner) => {
        const group = document.createElement("div");
        const columnDom = document.createElement("span");
        columnDom.className = "column";

        if (type.trans) {
            columnDom.innerText = L(type.trans, "C") || type.name;
        }

        if (type.format) val = type.format(val);

        const valDom = document.createElement(type.type || "span");
        console.log(valDom);
        valDom.className = type.valueClass || "value";

        valDom[type.value || "innerText"] = val;

        group.append(columnDom, valDom);

        if (type.button) {
            columnDom.append(type.button(task.id, valDom));
        }

        if (inner) {
            const upperGroup = document.createElement("div");
            upperGroup.append(group);

            return upperGroup;
        }

        return group;
    };

    const el = document.createElement("div");
    el.className = "task";

    for (const column of table) {
        const val = task[column.name];

        if (val || val === "") {
            if (column.name === "id") {
                const columnDom = createColumn(column, val, true);
                columnDom.className = "task-id-column";

                columnDom.appendChild(createDeleteButton(Number(val)));

                el.appendChild(columnDom);
                continue;
            }

            const columnDom = createColumn(column, val);
            el.appendChild(columnDom);
        }
    }

    el.appendChild(createButtons());

    return el;
}

function initNewButton() {
    const createNewButton = q(".task-create");
    const createNewId = q(".task-id");
    const createNewText = q(".task-name");
    const error = q("#new-task .error");

    createNewButton.onclick = async () => {
        const name = createNewText.value.trim();
        const external_id = createNewId.value.trim();

        if (!name || !external_id) {
            error.innerText = L("fill_the_fields", "C", 1);

            return;
        }

        const body = { name, external_id };
        const res = await request("/tasks/create", "POST", body).catch((err) => {
            console.error(err);

            error.innerText = err.message;
        });

        if (!res) return;

        if (res.error) {
            error.innerText = L(res.error, "C");

            return;
        }

        error.innerText = "";
        createNewText.value = "";
        createNewId.value = "";
        tasksGroups[0].prepend(renderTask(res));
    };
}

function initSearchFields() {
    const search = SEARCH.get("search") || "";

    const searchText = q(".task-search");
    searchText.value = search;

    const doSearch = () => {
        refreshWithNewSearch("search", searchText.value);
    };

    searchText.addEventListener("keyup", (e) => {
        if (e.key !== "Enter") return;

        doSearch();
    });

    q(".task-search-clear").onclick = (e) => {
        refreshWithNewSearch("search", "");
    };

    q(".task-search-action").onclick = doSearch;

    return search;
}

async function start() {
    initNewButton();
    const search = initSearchFields();

    const tasks = await request("/tasks", "GET", { search });
    for (const task of tasks) {
        const taskDom = renderTask(task);

        tasksGroups[task.status].appendChild(taskDom);

        qq(".value-max").forEach((el) => {
            el.dispatchEvent(new Event("keydown"));
        });
    }
}
