const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.CSAT_DB_PATH || path.join(__dirname, "data", "csat.db");

let db;

const initDatabase = async () => {
  await fs.promises.mkdir(path.dirname(dbPath), { recursive: true });
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitted_at TEXT NOT NULL,
      respondent_email TEXT,
      payload TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS survey_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      score INTEGER,
      FOREIGN KEY (response_id) REFERENCES survey_responses (id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS survey_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT,
      FOREIGN KEY (response_id) REFERENCES survey_responses (id)
    );
  `);
};

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.post("/api/csat-responses", async (req, res) => {
  const { timestamp, respondentEmail, ratings, comments } = req.body ?? {};

  if (!timestamp) {
    return res.status(400).json({ error: "Missing timestamp" });
  }

  try {
    await db.exec("BEGIN TRANSACTION;");

    const result = await db.run(
      "INSERT INTO survey_responses (submitted_at, respondent_email, payload) VALUES (?, ?, ?)",
      timestamp,
      respondentEmail || null,
      JSON.stringify(req.body)
    );

    const responseId = result.lastID;

    if (Array.isArray(ratings)) {
      for (const rating of ratings) {
        await db.run(
          "INSERT INTO survey_ratings (response_id, question, score) VALUES (?, ?, ?)",
          responseId,
          rating.question || "Unknown",
          rating.score ?? null
        );
      }
    }

    if (Array.isArray(comments)) {
      for (const comment of comments) {
        await db.run(
          "INSERT INTO survey_comments (response_id, prompt, response) VALUES (?, ?, ?)",
          responseId,
          comment.prompt || "Unknown",
          comment.response ?? null
        );
      }
    }

    await db.exec("COMMIT;");
    return res.status(201).json({ ok: true, id: responseId });
  } catch (error) {
    await db.exec("ROLLBACK;");
    console.error("Failed to store survey response", error);
    return res.status(500).json({ error: "Unable to save response" });
  }
});

const startServer = async () => {
  await initDatabase();
  app.listen(port, () => {
    console.log(`CSAT server listening on port ${port}`);
    console.log(`Database path: ${dbPath}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
