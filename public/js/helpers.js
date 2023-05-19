const BACKEND_PREFIX = "/api";
const SEARCH = new URL(document.location).searchParams;
const DATE_FORMAT = "DD-MM-yyyy";
const TIME_FORMAT = "HH:mm";
const DATE_TIME_FORMAT = "DD-MM-yyyy HH:mm:ss";

async function request(path, method, data) {
    try {
        path = `${BACKEND_PREFIX}/${path}`;

        /** @type {RequestInit} */
        const options = {
            method,
            headers: {},
        };

        if (method !== "GET") {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(data);
        } else if (data) {
            path += `?${new URLSearchParams(data)}`;
        }

        const response = await fetch(path, options);

        const result = await response.json();

        return result;
    } catch (error) {
        console.error("ReqError:", error);
        throw error;
    }
}

function createElementWithText(el, text, className) {
    const elem = document.createElement(el);

    elem.innerText = text;
    if (className) elem.className = className;

    return elem;
}

function q(selector) {
    return document.querySelector(selector);
}

function qq(selector) {
    return document.querySelectorAll(selector);
}

function minutesToSummary(minutes) {
    minutes = Number(minutes);

    const cascade = (inMinutes) => {
        const val = Math.floor(minutes / inMinutes);

        minutes = minutes % inMinutes;

        return val;
    };

    const weeks = cascade(2400);
    const days = cascade(480);
    const hours = cascade(60);

    const result = {
        w: weeks,
        d: days,
        h: hours,
        m: minutes,
    };

    let str = "";
    for (const [letter, amount] of Object.entries(result)) {
        if (amount) str += `${amount}${letter} `;
    }

    return str;
}

function L(str, mode, modeCount) {
    str = str.trim();
    const words = str.split(" ");

    const MODES = {
        U: (key) => key.toUpperCase(),
        l: (key) => key,
        C: (key) => key[0].toUpperCase() + key.slice(1),
    };

    words.forEach((word, i) => {
        let trans = TRANS[word];

        if (trans) {
            if (mode && (!modeCount || modeCount > i)) {
                trans = MODES[mode](trans);
            }

            str = str.replace(word, trans);
        }
    });

    return str;
}

function refreshWithNewSearch(key, value) {
    if (!value) SEARCH.delete(key);
    else SEARCH.set(key, value);

    let searchParams = SEARCH + "";

    if (searchParams) searchParams = `?${searchParams}`;

    const url = `${window.location.pathname}${searchParams}`;

    window.location.href = url;
}

const getTimeFromDate = (date) => date.slice(11, 16);
