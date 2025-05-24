"use strict";

// Declaring Variables
let currentScore = 0;
let activePlayer = 1;
let player1Score = 0;
let player2Score = 0;
const winScore = 100;
let socket;
let gameId;
let playerNumber;
let isPlayerTurn = false;
let isGameCreator = false;

// Selecting elements
const elements = {
  score1El: document.querySelector("#score--1"),
  score2El: document.querySelector("#score--2"),
  diceEl: document.querySelector(".dice"),
  btnNewGame: document.querySelector(".btn--new"),
  btnRollDice: document.querySelector(".btn--roll"),
  btnHoldTurn: document.querySelector(".btn--hold"),
  currentScore1: document.querySelector("#current--1"),
  currentScore2: document.querySelector("#current--2"),
  player1Conffeti: document.querySelector(".confetti-img1"),
  player2Conffeti: document.querySelector(".confetti-img2"),
  player1Active: document.querySelector(".player--1"),
  player2Active: document.querySelector(".player--2"),
  connectForm: document.querySelector("#connect-form"),
  gameIdInput: document.querySelector("#game-id"),
  connectBtn: document.querySelector("#connect-btn"),
  playerIdDisplay: document.querySelector("#player-id-display"),
  onlinePlayersList: document.querySelector("#online-players-list"),
  notification: document.getElementById("notification"),
  notificationMessage: document.getElementById("notification-message"),
  notificationCloseBtn: document.getElementById("notification-close-btn"),
};

// Generate a unique alphanumeric ID for the player (max 4 characters)
const playerId = Math.random().toString(36).substring(2, 6);
// Show player's ID initially
elements.playerIdDisplay.textContent = `Your ID: ${playerId}`;
elements.playerIdDisplay.classList.remove("hidden");

// Simulate active players list
const activePlayers = new Set([playerId]);

// Function to render active players
function renderActivePlayers() {
  elements.onlinePlayersList.innerHTML = ""; // Clear the list
  activePlayers.forEach((id) => {
    if (id !== playerId && !Array.from(elements.onlinePlayersList.children).some((child) => child.textContent === id)) {
      // Ensure the current player is not added and avoid duplicates
      const playerItem = document.createElement("li");
      playerItem.className = "online-player";
      playerItem.textContent = id;
      playerItem.onclick = () => connectToPlayer(id);
      elements.onlinePlayersList.appendChild(playerItem);
    }
  });
}

// Notify the user of other players who are online
function notifyOnlinePlayers(players) {
  players.forEach((player) => {
    if (player.id !== playerId) {
      showNotification(`Player ${player.id} is online. Click their ID to connect.`);
    }
  });
}

// Add custom modal function
function showModal(message) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">OK</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 3000);
}

// Function to connect to another player
function connectToPlayer(id) {
  if (!socket) {
    showModal("You must connect to the game before connecting to a player.");
    return;
  }

  if (id !== playerId) {
    socket.emit("connectToPlayer", { targetPlayerId: id, sourcePlayerId: playerId });
  } else {
    showModal("You cannot connect to yourself!");
  }
}

// Listen for connection confirmation from the server
function setupSocketListeners() {
  socket.on("connectionEstablished", (data) => {
    showModal(`Successfully connected to player: ${data.targetPlayerId}`);
  });

  socket.on("connectionRequest", (data) => {
    console.log(`Received connection request from Player ${data.sourcePlayerId}`);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <p>Player ${data.sourcePlayerId} wants to connect with you.</p>
        <button onclick="acceptConnection(true)">Accept</button>
        <button onclick="acceptConnection(false)">Decline</button>
      </div>
    `;
    document.body.appendChild(modal);

    window.acceptConnection = (accepted) => {
      modal.remove();
      if (accepted) {
        socket.emit("acceptConnection", { targetPlayerId: playerId, sourcePlayerId: data.sourcePlayerId });
        // Immediately create and join game
        gameId = `${data.sourcePlayerId}-${playerId}`;
        socket.emit("joinGame", { gameId, isInitiator: true });
      }
    };
  });

  socket.on("connectionAccepted", (data) => {
    console.log(`Connection accepted by Player ${data.targetPlayerId}`);
    gameId = `${playerId}-${data.targetPlayerId}`;
    console.log(`Generated game ID: ${gameId}`);
    socket.emit("joinGame", { gameId, isInitiator: false }); // Add isInitiator flag
  });

  socket.on("playerAssigned", (number) => {
    console.log(`Assigned as Player ${number}`);
    playerNumber = number;
    elements.connectForm.classList.add("hidden");
    elements.playerIdDisplay.textContent = `Player ${number}`;

    if (number === 1) {
      isGameCreator = true;
    }
    
    // Show game controls
    elements.btnRollDice.classList.remove("hidden");
    elements.btnHoldTurn.classList.remove("hidden");
    elements.btnNewGame.classList.remove("hidden");
  });

  socket.on("gameReady", ({ opponentId }) => {
    console.log(`Game ready to start. Opponent: ${opponentId}`);
    initializeGame();
    // Set initial turn
    isPlayerTurn = playerNumber === 1;
    if (isPlayerTurn) {
      showModal("It's your turn! Roll the dice.");
      elements.player1Active.classList.add("player--active");
      elements.player2Active.classList.remove("player--active");
    } else {
      showModal("Waiting for the other player to take their turn.");
      elements.player1Active.classList.remove("player--active");
      elements.player2Active.classList.add("player--active");
    }
  });

  socket.on("diceRolled", (diceNum) => {
    console.log(`Dice rolled: ${diceNum}`);
    handleDiceRoll(diceNum);
  });

  socket.on("updateScores", (playerScores, nextPlayer) => {
    console.log(`Scores updated:`, playerScores);
    updateScores(playerScores);
    isPlayerTurn = nextPlayer === playerNumber;
    switchPlayer();
  });

  socket.on("updatePlayerList", (players) => {
    updateOnlinePlayers(players);
  });

  socket.on("connectionError", (data) => {
    showModal(data.message);
  });

  socket.on("gameFull", () => {
    showModal("Game is full. Please try another game.");
  });

  socket.on("newGameNotification", (gameId) => {
    showNotification(`A new game with ID ${gameId} is available!`);
  });

  socket.on("playerRequestJoin", (newPlayerId) => {
    if (isGameCreator) {
      const accept = confirm(`Player ${newPlayerId} wants to join your game. Accept?`);
      if (accept) {
        acceptPlayer(newPlayerId);
      }
    }
  });
}

// Function to initialize the game state
function initializeGame() {
  resetGame(); // Reset the game state for a fresh start
  isPlayerTurn = playerNumber === 1; // Player 1 starts the game
  if (isPlayerTurn) {
    showModal("It's your turn! Roll the dice.");
  } else {
    showModal("Waiting for the other player to take their turn.");
  }
}

// Function to handle dice roll with animation
function handleDiceRoll(diceNum) {
  console.log(`Processing dice roll: ${diceNum}`);
  const diceElement = elements.diceEl;
  diceElement.classList.remove("hidden");
  
  // Dice rolling animation
  let rollCount = 0;
  const maxRolls = 10;
  const rollInterval = setInterval(() => {
    const randomNum = Math.floor(Math.random() * 6) + 1;
    diceElement.src = `./img/dice-${randomNum}.png`;
    rollCount++;
    
    if (rollCount >= maxRolls) {
      clearInterval(rollInterval);
      // Show final dice number
      diceElement.src = `./img/dice-${diceNum}.png`;
      
      if (diceNum === 1) {
        currentScore = 0;
        switchPlayer();
      } else {
        currentScore += diceNum;
        document.querySelector(`#current--${activePlayer}`).textContent = currentScore;
      }
    }
  }, 100);
}

// Function to switch players
function switchPlayer() {
  console.log(`Switching from Player ${activePlayer} to Player ${activePlayer === 1 ? 2 : 1}`);
  document.querySelector(`#current--${activePlayer}`).textContent = 0;
  currentScore = 0;
  activePlayer = activePlayer === 1 ? 2 : 1;

  // Add next player animation with correct image path
  const nextGif = document.createElement('img');
  nextGif.src = './img/nextGif.gif';  // Updated image path
  nextGif.classList.add(activePlayer === 1 ? 'nextGif' : 'nextGif2');
  document.body.appendChild(nextGif);

  // Remove the animation after 1 second
  setTimeout(() => {
    nextGif.remove();
  }, 1000);

  elements.player1Active.classList.toggle("player--active");
  elements.player2Active.classList.toggle("player--active");
  isPlayerTurn = activePlayer === playerNumber;

  if (isPlayerTurn) {
    showModal("It's your turn!");
  }
}

// Function to update scores
function updateScores(playerScores) {
  console.log(`Updating scores:`, playerScores);
  elements.score1El.textContent = playerScores.player1;
  elements.score2El.textContent = playerScores.player2;

  if (playerScores.player1 >= winScore || playerScores.player2 >= winScore) {
    const winner = playerScores.player1 >= winScore ? 1 : 2;
    // Show winning animation
    elements[`player${winner}Conffeti`].classList.remove("hidden");
    elements[`player${winner}Active`].classList.add("player--winner");
    showModal(`Player ${winner} wins!`);
    
    // Remove winning animation after 3 seconds
    setTimeout(() => {
      elements[`player${winner}Conffeti`].classList.add("hidden");
      elements[`player${winner}Active`].classList.remove("player--winner");
      resetGame();
    }, 3000);
  }
}

// Function to update the online players list dynamically
function updateOnlinePlayers(players) {
  elements.onlinePlayersList.innerHTML = "";
  players.forEach((player) => {
    if (player.id !== socket.id) {
      const playerItem = document.createElement("li");
      playerItem.className = "online-player";
      // Display player ID in the same format as shown at the top
      const displayId = `Your ID: ${player.id.slice(-4)}`;
      playerItem.textContent = displayId;
      playerItem.onclick = () => connectToPlayer(player.id);
      elements.onlinePlayersList.appendChild(playerItem);
    }
  });
}

// Function to show notification
function showNotification(message) {
  elements.notificationMessage.textContent = message;
  elements.notification.classList.remove("hidden");

  elements.notificationCloseBtn.addEventListener("click", () => {
    elements.notification.classList.add("hidden");
  });
}

// Function to reset game state
function resetGame() {
  Object.assign(elements, {
    score1El: { textContent: 0 },
    score2El: { textContent: 0 },
    currentScore1: { textContent: 0 },
    currentScore2: { textContent: 0 },
  });
  elements.diceEl.classList.add("hidden");
  elements.player1Conffeti.classList.add("hidden");
  elements.player2Conffeti.classList.add("hidden");
  elements.player1Active.classList.add("player--active");
  elements.player2Active.classList.remove("player--active");
  currentScore = 0;
  activePlayer = 1;
  player1Score = 0;
  player2Score = 0;
  isPlayerTurn = false;
  isGameCreator = false;
  elements.connectForm.classList.remove("hidden");
  elements.playerIdDisplay.classList.add("hidden");
  elements.onlinePlayersList.innerHTML = "";
  elements.notification.classList.add("hidden");
}

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  socket = io("http://localhost:5000"); // Initialize socket once
  setupSocketListeners();
  renderActivePlayers();
});

// Socket.IO Setup
function connectToGame() {
  try {
    gameId = elements.gameIdInput.value || `game-${Math.random().toString(36).substring(2, 6)}`;
    socket.emit("joinGame", gameId);
  } catch (error) {
    console.error("Error connecting to game:", error);
  }
}

// Event Listeners
elements.connectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  connectToGame();
});

elements.btnRollDice.addEventListener("click", () => {
  if (isPlayerTurn) {
    socket.emit("rollDice", gameId);
  } else {
    showModal("It's not your turn!");
  }
});

elements.btnHoldTurn.addEventListener("click", () => {
  if (isPlayerTurn) {
    const playerScores = {
      player1: Number(elements.score1El.textContent),
      player2: Number(elements.score2El.textContent),
    };
    socket.emit("hold", gameId, playerScores);
  } else {
    showModal("It's not your turn!");
  }
});

elements.btnNewGame.addEventListener("click", () => {
  resetGame();
  if (isGameCreator) {
    notifyOpenPlayers(gameId);
  }
});