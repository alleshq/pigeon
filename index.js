const axios = require("axios");
const fs = require("fs");
const template = fs.readFileSync(`${__dirname}/template.html`, "utf8").split("[x]");

// Express
const express = require("express");
const app = express();
app.use(require("body-parser").json());
app.use((err, req, res, next) => res.status(500).json({ err: "internalError" }));
app.use((req, res, next) => {
    if (req.headers.authorization === process.env.SECRET) next();
    else res.status(401).json({ err: "badAuthorization" });
});
app.listen(8080);

// Database
const level = require("level");
const db = level("./db", { valueEncoding: "json" });

// Get Email Address
app.get("/email/:id", (req, res) => {
    db.get(req.params.id, (err, email) => {
        if (err) return res.status(400).send({ err: "missingResource" });
        res.json({ email });
    });
});

// Set Email Address
app.post("/email/:id", (req, res) => {
    if (typeof req.body.email !== "string") return res.status(500).json({ err: "badRequest" });

    db.put(req.params.id, req.body.email, err => {
        if (err) return res.status(500).json({ err: "internalError" });
        res.json({});
    });
});

// Send Email
app.post("/send/:id", (req, res) => {
    if (
        typeof req.body.subject !== "string" ||
        typeof req.body.content !== "string"
    ) return res.status(500).json({ err: "badRequest" });

    // Get Address
    db.get(req.params.id, (err, email) => {
        if (err) return res.status(400).send({ err: "missingResource" });

        // Send via Postal
        axios.post(
            "https://pico.alles.cx/api/v1/send/message",
            {
                to: [email],
                from: "The Alles Robot <robot@alles.cx>",
                subject: req.body.subject,
                html_body:
                    template[0] +
                    req.body.content +
                    template[1] +
                    email +
                    template[2] +
                    req.params.id +
                    template[3] +
                    (new Date().toUTCString()) +
                    template[4]
            },
            {
                headers: {
                    "X-Server-API-Key": process.env.POSTAL
                }
            }
        ).then(() => {
            res.json({});
        }).catch(() => {
            res.status(500).json({ err: "internalError" });
        });
    });
});