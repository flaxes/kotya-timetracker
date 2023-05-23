async function init() {
    TRANS = await request("lang");

    const toTranslate = qq('[t*=" "]');

    toTranslate.forEach((el) => {
        el.innerText = L(el.getAttribute("t"), "C", 1);
    });

    const versions = await request("version");

    if (versions.version !== versions.available) {
        const updateBtn = q(".update-action");

        updateBtn.hidden = false;
        updateBtn.onclick = () => {
            request("update");
        };
    }
}

init()
    .then(() => start && start())
    .catch((err) => {
        console.error(err);

        alert(`FATAL: ${err.message}`);
    });
