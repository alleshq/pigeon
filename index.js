// Express
const express = require("express");
const app = express();
app.use(require("body-parser").json());
app.use((err, req, res, next) => res.status(500).send("internalError"));
app.listen(8080);

// Database
const level = require("level");
const db = level("./db", { valueEncoding: "json" });

// Set Email Address
app.post("/email/:id", (req, res) => {
    if (typeof req.body.email !== "string") return res.status(400).send("badRequest");

    db.put(req.params.id, req.body.email, err => {
        if (err) return res.status(500).send("internalError");
        res.send("success");
    });
});