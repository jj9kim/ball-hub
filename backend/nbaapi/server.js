const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

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

// NBA API Integration
async function getNBAGames() {
  try {
    console.log("Fetching games from NBA API...");

    // Using the NBA API endpoint directly
    const response = await axios.get(
      "https://stats.nba.com/stats/leaguegamefinder",
      {
        params: {
          LeagueID: "00",
          Season: "2025-26",
          SeasonType: "Regular Season",
          PlayerOrTeam: "T",
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: "https://www.nba.com/",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    const data = response.data;
    console.log("Successfully fetched NBA data");
    return data;
  } catch (error) {
    console.error("Error fetching NBA data:", error.message);
    return null;
  }
}

// NEW NBA API ROUTES
app.get("/api/nba/games/season/current", async (req, res) => {
  try {
    const nbaData = await getNBAGames();

    if (!nbaData || !nbaData.resultSets || !nbaData.resultSets[0]) {
      return res.status(500).json({ error: "Failed to fetch NBA data" });
    }

    const games = nbaData.resultSets[0];
    const rowSet = games.rowSet;
    const headers = games.headers;

    // Find column indices
    const gameIdIndex = headers.indexOf("GAME_ID");
    const gameDateIndex = headers.indexOf("GAME_DATE");
    const teamIdIndex = headers.indexOf("TEAM_ID");
    const ptsIndex = headers.indexOf("PTS");
    const matchupIndex = headers.indexOf("MATCHUP");
    const seasonIdIndex = headers.indexOf("SEASON_ID");

    if (gameIdIndex === -1 || gameDateIndex === -1) {
      return res
        .status(500)
        .json({ error: "Unexpected NBA API response format" });
    }

    // Filter for current season and home games
    const homeGames = rowSet.filter((game) => {
      const matchup = game[matchupIndex];
      const seasonId = game[seasonIdIndex];
      return matchup && matchup.includes(" vs. ") && seasonId === "22025";
    });

    // Group by game ID to get home and away teams
    const gameMap = new Map();

    homeGames.forEach((game) => {
      const gameId = game[gameIdIndex];
      const matchup = game[matchupIndex];

      if (!gameMap.has(gameId)) {
        // Parse matchup to get teams (format: "ATL vs. BOS")
        const teams = matchup.split(" vs. ");
        const awayTeamAbbr = teams[0];
        const homeTeamAbbr = teams[1];

        gameMap.set(gameId, {
          game_id: gameId,
          game_date: game[gameDateIndex].split("T")[0], // Get just the date part
          home_team_id: game[teamIdIndex],
          home_team_score: game[ptsIndex],
          matchup: matchup,
          away_team_abbr: awayTeamAbbr,
          home_team_abbr: homeTeamAbbr,
        });
      }
    });

    // Now we need to find the away team scores
    const finalGames = [];

    for (const [gameId, gameData] of gameMap) {
      // Find the away team's row for this game
      const awayGame = rowSet.find((game) => {
        return (
          game[gameIdIndex] === gameId &&
          game[teamIdIndex] !== gameData.home_team_id &&
          game[matchupIndex].includes(" @ ")
        );
      });

      if (awayGame) {
        finalGames.push({
          game_id: gameData.game_id,
          game_date: gameData.game_date,
          home_team_id: gameData.home_team_id,
          away_team_id: awayGame[teamIdIndex],
          home_team_score: gameData.home_team_score,
          away_team_score: awayGame[ptsIndex],
          matchup: gameData.matchup,
        });
      }
    }

    console.log(`Returning ${finalGames.length} NBA games`);
    res.json(finalGames);
  } catch (error) {
    console.error("Error in NBA games endpoint:", error);
    res.status(500).json({ error: "Failed to fetch NBA games" });
  }
});

app.get("/api/nba/games/date/:date", async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`Fetching NBA games for date: ${date}`);

    const nbaData = await getNBAGames();

    if (!nbaData || !nbaData.resultSets || !nbaData.resultSets[0]) {
      return res.status(500).json({ error: "Failed to fetch NBA data" });
    }

    const games = nbaData.resultSets[0];
    const rowSet = games.rowSet;
    const headers = games.headers;

    // Find column indices
    const gameIdIndex = headers.indexOf("GAME_ID");
    const gameDateIndex = headers.indexOf("GAME_DATE");
    const teamIdIndex = headers.indexOf("TEAM_ID");
    const ptsIndex = headers.indexOf("PTS");
    const matchupIndex = headers.indexOf("MATCHUP");

    // Filter for the specific date and home games
    const gamesForDate = rowSet.filter((game) => {
      const gameDate = game[gameDateIndex].split("T")[0];
      const matchup = game[matchupIndex];
      return gameDate === date && matchup && matchup.includes(" vs. ");
    });

    const finalGames = [];
    const processedGameIds = new Set();

    gamesForDate.forEach((game) => {
      const gameId = game[gameIdIndex];

      if (processedGameIds.has(gameId)) {
        return;
      }

      // Find the away team's row for this game
      const awayGame = rowSet.find((away) => {
        return (
          away[gameIdIndex] === gameId &&
          away[teamIdIndex] !== game[teamIdIndex] &&
          away[matchupIndex].includes(" @ ")
        );
      });

      if (awayGame) {
        finalGames.push({
          game_id: gameId,
          game_date: date,
          home_team_id: game[teamIdIndex],
          away_team_id: awayGame[teamIdIndex],
          home_team_score: game[ptsIndex],
          away_team_score: awayGame[ptsIndex],
          matchup: game[matchupIndex],
        });

        processedGameIds.add(gameId);
      }
    });

    console.log(`Found ${finalGames.length} games for ${date}`);
    res.json(finalGames);
  } catch (error) {
    console.error("Error in NBA games by date endpoint:", error);
    res.status(500).json({ error: "Failed to fetch NBA games for date" });
  }
});

// Keep your existing routes for backward compatibility
// db1
app.get("/", (req, res) => {
  res.json("From backend");
});

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

app.listen(8081, () => {
  console.log("Server listening on port 8081");
});
