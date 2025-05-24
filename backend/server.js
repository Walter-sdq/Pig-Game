const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"]
  },
  transports: ['websocket', 'polling']
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
  console.log("🟢 New player connected:", socket.id);

  try {
    // Add player to connected players with timestamp
    connectedPlayers[socket.id] = { 
      id: socket.id, 
      gameId: null,
      connectedAt: new Date().toISOString()
    };

    // Debug log current state
    console.log("Current players:", Object.keys(connectedPlayers).length);
    console.log("Active games:", Object.keys(games).length);

    // Notify all players of the updated player list
    io.emit("updatePlayerList", Object.values(connectedPlayers));

    // Handle connection requests between players
    socket.on("connectToPlayer", ({ targetPlayerId, sourcePlayerId }) => {
      console.log("🎯 Connection request:", sourcePlayerId, "->", targetPlayerId);
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

    // Handle joinGame with better error handling
    socket.on("joinGame", ({ gameId, isInitiator }) => {
      console.log(`🎮 Join attempt - Game: ${gameId}, Player: ${socket.id}, Initiator: ${isInitiator}`);
      const game = getOrCreateGame(gameId);
      
      // Debug log game state
      console.log("Game state before join:", {
        gameId,
        players: game.players,
        state: game.state
      });

      if (!game.players.includes(socket.id)) {
        game.players.push(socket.id);
      }

      // Check game state after update
      console.log("Game state after join:", {
        gameId,
        players: game.players,
        state: game.state
      });

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

    // Add error handling for game actions
    socket.on("rollDice", (gameId) => {
      const game = games[gameId];
      if (!game) {
        console.error("❌ Game not found:", gameId);
        socket.emit("error", { message: "Game not found" });
        return;
      }
      
      if (!game.players.includes(socket.id)) {
        console.error("❌ Player not in game:", socket.id);
        socket.emit("error", { message: "You're not in this game" });
        return;
      }

      const diceRoll = Math.floor(Math.random() * 6) + 1;
      console.log(`🎲 Player ${socket.id} rolled ${diceRoll} in game ${gameId}`);
      io.to(gameId).emit("diceRolled", diceRoll);
    });

    // Handle hold action
    socket.on("hold", (gameId, playerScores) => {
      const game = getOrCreateGame(gameId);
      game.state = playerScores;
      io.to(gameId).emit("updateScores", playerScores);
    });

    // Handle disconnections more gracefully
    socket.on("disconnect", (reason) => {
      console.log("🔴 Player disconnected:", socket.id, "Reason:", reason);
      
      // Find any games this player was in
      Object.entries(games).forEach(([gameId, game]) => {
        if (game.players.includes(socket.id)) {
          console.log(`Cleaning up game ${gameId} after disconnect`);
          // Notify other players
          game.players.forEach(playerId => {
            if (playerId !== socket.id) {
              io.to(playerId).emit("playerDisconnected", {
                message: "Opponent disconnected"
              });
            }
          });
          delete games[gameId];
        }
      });
      
      delete connectedPlayers[socket.id];
      io.emit("updatePlayerList", Object.values(connectedPlayers));
    });

    socket.on("error", (error) => {
      console.error("🔴 Socket error:", error);
    });
  } catch (error) {
    console.error("🔴 Fatal error:", error);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
