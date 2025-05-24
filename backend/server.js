const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 5000;

// Store game states
const games = {};

// Store connected players
const connectedPlayers = {};

// Serve static files (frontend)
app.use(express.static("../frontend"));

// Utility function to get or create a game
const getOrCreateGame = (gameId) => {
  if (!games[gameId]) {
    games[gameId] = { players: [], state: {} };
  }
  return games[gameId];
};

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  try {
    // Add player to connected players
    connectedPlayers[socket.id] = { id: socket.id, gameId: null };

    // Notify all players of the updated player list
    io.emit("updatePlayerList", Object.values(connectedPlayers));

    // Handle connection requests between players
    socket.on("connectToPlayer", ({ targetPlayerId, sourcePlayerId }) => {
      console.log(`${sourcePlayerId} requesting connection to ${targetPlayerId}`);
      const targetSocket = io.sockets.sockets.get(targetPlayerId);
      if (targetSocket) {
        targetSocket.emit("connectionRequest", { sourcePlayerId });
      } else {
        socket.emit("connectionError", { message: "Player is not available." });
      }
    });

    // Handle acceptance of connection requests
    socket.on("acceptConnection", ({ targetPlayerId, sourcePlayerId }) => {
      const sourceSocket = io.sockets.sockets.get(sourcePlayerId);
      if (sourceSocket) {
        sourceSocket.emit("connectionAccepted", { targetPlayerId });
      }
    });

    // Join a game room
    socket.on("joinGame", (gameId) => {
      console.log(`Player ${socket.id} joining game ${gameId}`);
      const game = getOrCreateGame(gameId);

      if (game.players.length < 2) {
        const playerNumber = game.players.length + 1;
        console.log(`Assigning as Player ${playerNumber}`);
        game.players.push(socket.id);
        connectedPlayers[socket.id].gameId = gameId;
        socket.join(gameId);
        
        // Emit player number assignment
        socket.emit("playerAssigned", playerNumber);

        // When two players have joined, start the game
        if (game.players.length === 2) {
          console.log(`Game ${gameId} is now full and starting`);
          const [player1, player2] = game.players;
          io.to(player1).emit("gameReady", { opponentId: player2 });
          io.to(player2).emit("gameReady", { opponentId: player1 });
          
          // Initialize game state
          game.state = {
            currentPlayer: 1,
            scores: { player1: 0, player2: 0 },
            currentScore: 0
          };
        }
      } else {
        socket.emit("gameFull");
      }
      io.emit("updatePlayerList", Object.values(connectedPlayers));
    });

    // Handle dice roll
    socket.on("rollDice", (gameId) => {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      console.log(`Player ${socket.id} rolled ${diceRoll} in game ${gameId}`);
      io.to(gameId).emit("diceRolled", diceRoll);
    });

    // Handle hold action
    socket.on("hold", (gameId, playerScores) => {
      const game = getOrCreateGame(gameId);
      game.state = playerScores;
      io.to(gameId).emit("updateScores", playerScores);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      // Remove player from connected players
      delete connectedPlayers[socket.id];

      // Notify all players of the updated player list
      io.emit("updatePlayerList", Object.values(connectedPlayers));

      for (const gameId in games) {
        const game = games[gameId];
        game.players = game.players.filter((id) => id !== socket.id);
        if (game.players.length === 0) {
          delete games[gameId];
        }
      }
    });
  } catch (error) {
    console.error("Socket error:", error);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
