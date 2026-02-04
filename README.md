# CsatAkkodisMiddleEast
Akkodis Middle East Csat Collector

## Local database setup

Survey submissions are stored in a local SQLite database. Start the server to create
the database and accept POSTs from the survey page:

```bash
npm install
npm start
```

The server creates `data/csat.db` and exposes `POST /api/csat-responses` for the
front-end form. You can override the database path with `CSAT_DB_PATH` and the port
with `PORT`.
