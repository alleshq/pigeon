const axios = require("axios");

// Express
const express = require("express");
const app = express();
app.use(require("body-parser").json());
app.use((err, req, res, next) => res.status(500).json({ err: "internalError" }));
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
                html_body: req.body.content
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