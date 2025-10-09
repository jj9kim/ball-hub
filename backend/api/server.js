const express = require('express');
const sqlite3 = require("sqlite3").verbose();
const cors = require('cors')

const app = express()
app.use(cors())

const db = new sqlite3.Database("../games.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

const db2 = new sqlite3.Database("../nba_standings.db", (err) => {
  if (err) {
    console.error("Error opening database2:", err);
  } else {
    console.log("Connected to SQLite database2");
  }
});

// db1

app.get("/", (req, res) => {
    res.json("From backend")
})

app.get("/game_info", (req, res) => {
  const sql = "SELECT * FROM game_info";
  db.all(sql, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

app.get("/games", (req, res) => {
  const sql = "SELECT * FROM games";
  db.all(sql, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

app.get("/team_stats", (req, res) => {
  const sql = "SELECT * FROM team_stats";
  db.all(sql, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

// db2

app.get("/advanced_splits", (req, res) => {
  const sql = "SELECT * FROM advanced_splits";
  db2.all(sql, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

app.get("/basic_standings", (req, res) => {
  const sql = "SELECT * FROM basic_standings";
  db2.all(sql, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

app.get("/conference_standings", (req, res) => {
  const sql = "SELECT * FROM conference_standings";
  db2.all(sql, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});


app.listen(8081, ()=>{
    console.log("listening")
})