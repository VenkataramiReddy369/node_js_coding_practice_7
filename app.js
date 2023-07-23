const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertDbMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertDbScoreObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    select *
    from 
    player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
     select * from player_details
     where player_id = ${playerId};`;
  const playerArray = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(playerArray));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    update 
    player_details
    SET
    player_name = '${playerName}';`;
  const player = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdQuery = `
    select *
    from match_details
    where match_id = ${matchId};
    `;
  const match = await db.get(getMatchIdQuery);
  response.send(convertDbMatchObjectToResponseObject(match));
});

// API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesPlayerQuery = `
  select * 
  from 
  player_match_score
  NATURAL JOIN match_details
  where player_id = ${playerId};`;
  const playerMatches = await db.all(getMatchesPlayerQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertDbMatchObjectToResponseObject(eachMatch)
    )
  );
});

// API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersMatchQuery = `
    select
   player_details.player_id AS playerId,
   player_details.player_name AS playerName
    from player_match_score
    INNER JOIN player_details
    where match_id = ${matchId};`;
  const playersMatch = await db.all(getPlayersMatchQuery);
  response.send(playersMatch);
});

// API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
  select 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  from player_details
  INNER JOIN
  player_match_score ON
  player_details.player_id = player_match_score.player_id
  where player_details.player_id = ${playerId};`;
  const specificPlayer = await db.get(getSpecificPlayerQuery);
  response.send(specificPlayer);
});
module.exports = app;
