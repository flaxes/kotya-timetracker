// @ts-check

const express = require("express");
const history = require("./history");
const L = require("./lang");
const tasks = require("./tasks");
const tracker = require("./tracker");

const app = express();

app.use(express.static("./public"));

const apiRouter = express.Router();

apiRouter.get("/lang", (req, res) => {
    res.json(L.list());
});

apiRouter.get("/history", async (req, res) => {
    res.json(await history.get());
});

apiRouter.get("/tasks", async (req, res) => {
    res.json(await tasks.get(req.query.search));
});

apiRouter.get("/tracker", async (req, res) => {
    const { query } = req;
    const result = await tracker.get(query.week);

    res.json(result);
});

apiRouter.use(express.json({ limit: "1mb" }));

apiRouter.post("/tasks/create", async (req, res) => {
    const { body } = req;

    const response = await tasks.add(body.name, body.external_id);

    res.json(response);
});

apiRouter.post("/tasks/delete", async (req, res) => {
    const { body } = req;

    const response = await tasks.hide(body.id);

    res.json(response);
});

apiRouter.post("/tasks/update", async (req, res) => {
    const { body } = req;

    const response = await tasks.changeStatus(body.id, body.status);

    res.json(response);
});

apiRouter.post("/tracker/create", async (req, res) => {
    const { body } = req;

    const track = {
        task_id: body.taskId,
        started_at: body.from,
        ended_at: body.to,
    };

    const response = await tracker.create(track);

    res.json(response);
});

apiRouter.post("/tracker/update", async (req, res) => {
    const { body } = req;

    const response = await tracker.update(body.taskId, body.trackId, body.from, body.to);

    res.json(response);
});

apiRouter.post("/tracker/delete", async (req, res) => {
    const { body } = req;

    const response = await tracker.delete(body.taskId, body.trackId);

    res.json(response);
});

app.use("/api", apiRouter);

module.exports = app;
