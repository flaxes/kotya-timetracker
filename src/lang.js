// @ts-check

const { lang } = require("../config");

/** @typedef {keyof typeof import('../langs/ru')} TransKey */

/** @type {Record<string, string>} */
const trans = require(`../langs/${lang}`);

class L {
    /** @param {TransKey} key */
    static U(key) {
        return trans[key].toUpperCase();
    }

    /** @param {TransKey} key */
    static C(key) {
        return trans[key][0].toUpperCase() + trans[key].slice(1);
    }

    /** @param {TransKey} key */
    static l(key) {
        return trans[key];
    }

    static list() {
        return trans;
    }
}

module.exports = L;
