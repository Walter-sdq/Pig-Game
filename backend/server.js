const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    credentials: true
  }
});

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
        const gameId = `${sourcePlayerId}-${targetPlayerId}`;
        const game = getOrCreateGame(gameId);
        game.players = [targetPlayerId, sourcePlayerId]; // Accepting player becomes Player 1
        
        // Initialize game state immediately
        game.state = {
          currentPlayer: 1,
          scores: { player1: 0, player2: 0 },
          currentScore: 0
        };
      }
    });

    // Join a game room
    socket.on("joinGame", ({ gameId, isInitiator }) => {
      console.log(`Player ${socket.id} joining game ${gameId}`);
      const game = getOrCreateGame(gameId);

      if (game.players.length < 2) {
        const playerNumber = game.players.indexOf(socket.id) + 1;
        socket.join(gameId);
        socket.emit("playerAssigned", playerNumber);
        console.log(`Assigned as Player ${playerNumber}`);

        if (game.players.length === 2) {
          const [player1, player2] = game.players;
          io.to(player1).emit("gameReady", { opponentId: player2 });
          io.to(player2).emit("gameReady", { opponentId: player1 });
          console.log(`Game ${gameId} is ready to start`);
          
          game.state = {
            currentPlayer: 1,
            scores: { player1: 0, player2: 0 },
            currentScore: 0
          };
        }
      } else {
        socket.emit("gameFull");
      }
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
