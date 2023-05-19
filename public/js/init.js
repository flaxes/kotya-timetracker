async function init() {
    TRANS = await request("/lang");

    const toTranslate = qq('[t*=" "]');

    toTranslate.forEach((el) => {
        el.innerText = L(el.getAttribute("t"), "C", 1);
    });
}

init()
    .then(() => start && start())
    .catch((err) => {
        console.error(err);

        alert(`FATAL: ${err.message}`);
    });
