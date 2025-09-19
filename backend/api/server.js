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

app.listen(8081, ()=>{
    console.log("listening")
})