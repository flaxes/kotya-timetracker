async function start() {
    const history = await request("history");

    const dom = document.querySelector("#history");

    let day = "";

    for (const story of history) {
        const [date, time] = story.created_at.split(" ");

        if (day !== date) {
            const div = document.createElement("hr");
            day = date;

            div.innerText = day;

            dom.appendChild(div);
        }

        const el = document.createElement("div");
        el.innerText = `${time} | ID:${story.task_id} | #${story.external_id} : ${L(story.text, "C", 1)}`;

        dom.appendChild(el);
    }
}
