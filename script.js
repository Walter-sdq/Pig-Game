'use strict';

// Selecting elements
const score1El = document.querySelector('#score--1');
const score2El = document.querySelector('#score--2');
const diceEl = document.querySelector('.dice');
const diceEl2 = document.querySelector('.dice2');
const btnNewGame = document.querySelector('.btn--new');
const btnRollDice = document.querySelector('.btn--roll');
const btnHoldTurn = document.querySelector('.btn--hold');
const currentScore1 = document.querySelector('#current--1');
const currentScore2 = document.querySelector('#current--2');
const player1Conffeti = document.querySelector('.confetti-img1');
const player2Conffeti = document.querySelector('.confetti-img2');
const player1Active = document.querySelector('.player--1');
const player2Active = document.querySelector('.player--2');
const loadingAnimation = document.querySelector('#reloadAnimation');
const nextPlayerGif1 = document.querySelector('.nextGif');
const nextPlayerGif2 = document.querySelector('.nextGif2');


// Starting Conditions
score1El.textContent = 0;
score2El.textContent = 0;
diceEl.classList.add('hidden');

// Declaring Variables
let currentScore = 0; // Reset current score
let activePlayer = 1; // 1 for Player 1, 2 for Player 2
let player1Score = 0;
let player2Score = 0;
const winScore = 100;



// Functions 
// Random Dice Roll Function 
const diceRollFunc = function () {
    // Animation Duration in millisecs
    const animationRoll = 100;
    const endAnimationRoll = 1000;

    // Start Rolling Animation
    const activateAnim = setInterval(() => {
        // Display Dice2 Image
        diceEl2.classList.remove('hidden');

        // Generate animation random Numbers
        let animRandNum = Math.floor(Math.random() * 6) + 1;

        diceEl2.src = `./img/dice-${animRandNum}.png`; //Display Random Dice Num
    }, animationRoll);

    // End Random Animation 
    setTimeout(() => {
        // Clear interval to stop animation
        clearInterval(activateAnim);

        // Hide Dice2 Image
        diceEl2.classList.add('hidden');
    }, endAnimationRoll);

};

// Track & Update Active Player Ui
const activePlayerUi = function (activePlayer) {
    // Clear Ui
    player1Active.classList.remove('player--active');
    player2Active.classList.remove('player--active');

    if (activePlayer === 1) {
        player1Active.classList.add('player--active');
    } else {
        player2Active.classList.add('player--active');
    }
};

// Track and use switch Player Gif 
const nextPlayerGif = function (activeplayer) {

    // Disable Roll Dice Btn
    btnRollDice.disabled = true;
    // Change cursor to not-allowed
    btnRollDice.style.cursor = 'not-allowed';

    // Change cursor to not-allowed
    btnHoldTurn.disabled = true;
    // Change cursor to not-allowed
    btnHoldTurn.style.cursor = 'not-allowed';

    if (activePlayer === 1) {
        // Display next player animation
        nextPlayerGif1.classList.remove('hidden');

        // Hide next player animation
        setTimeout(() => {
            nextPlayerGif1.classList.add('hidden');
        }, 1500);
    } else {
        // Display next player animation
        nextPlayerGif2.classList.remove('hidden');

        // Hide next player animation
        setTimeout(() => {
            nextPlayerGif2.classList.add('hidden');
        }, 1500);
    };


    // Re-Enable Btn if no player has won
    if (player1Score < winScore && player2Score < winScore) {
        setTimeout(() => {
            // Enable Roll Dice Btn
            btnRollDice.disabled = false;
            // Change cursor to pointer
            btnRollDice.style.cursor = 'pointer';

            // Enable Hold Btn
            btnHoldTurn.disabled = false;
            // Change cursor to pointer
            btnHoldTurn.style.cursor = 'pointer';
        }, 1500);
    };
};


// Confetti Display for winner & Ui Update
const confettiDisplay = function (num) {
    if (num === 1) {
        player1Conffeti.classList.remove('hidden');
        player1Active.classList.add('player--winner');
    } else {
        player2Conffeti.classList.remove('hidden');
        player2Active.classList.add('player--winner');
    };

};


// Update Player Score
const updatePlayerScore = function () {
    // Track and update Player Score
    if (activePlayer === 1) {
        // update Player 1 score
        player1Score += Number(currentScore1.textContent);// Convert to num before addition
        score1El.textContent = player1Score;

        // Check to see if =< 100
        if (player1Score >= winScore) {
            confettiDisplay(activePlayer);
            // Executed on win
            // onWinUpdate();
        };
    } else {
        // update Player 2 score
        player2Score += Number(currentScore2.textContent); // Convert to num before addition
        score2El.textContent = player2Score;

        // Check to see if =< 100
        if (player2Score >= winScore) {
            confettiDisplay(activePlayer);
            // Executed on win
            // onWinUpdate();
        };
    };
};


// Update Scores and Switch Players on Hold
const holdFunction = function () {
    // Reset current score
    currentScore = 0;

    // Update Player score
    updatePlayerScore();

    // Swithed Player Animation
    nextPlayerGif(activePlayer);

    // Reset displayed Current score & switch player
    if (activePlayer === 1) {
        currentScore1.textContent = 0;
        activePlayer = 2;
    } else {
        currentScore2.textContent = 0;
        activePlayer = 1;
    };


    // Update Active Player Ui
    activePlayerUi(activePlayer);
};


// Update Scores and Switch Players on Hold
const diceRoll1 = function () {
    // Reset current score
    currentScore = 0;

    // Discard Player score
    // Track and update Player Score
    if (activePlayer === 1) {
        // Player 1 lose current score
        currentScore1.textContent = 0;// update current score to zero

    } else {
        // Player 2 lose current score
        currentScore2.textContent = 0;// update current score to zero

    };

    // Swithed Player Animation
    nextPlayerGif(activePlayer);

    // Reset displayed Current score & switch player
    if (activePlayer === 1) {
        currentScore1.textContent = 0;
        activePlayer = 2;
    } else {
        currentScore2.textContent = 0;
        activePlayer = 1;
    };


    // Update Active Player Ui
    activePlayerUi(activePlayer);
};

// ====================== Event Listener

// Dice Roll
btnRollDice.addEventListener('click', function () {
    // Dice Random Roll Function
    diceRollFunc();

    let diceNum = 0; //declare dice variable 

    activePlayerUi(activePlayer);

    // Display Dice Image
    diceEl.classList.remove('hidden');

    // Generate Random Number
    diceNum = Number(Math.floor(Math.random() * 6) + 1);


    diceEl.src = `./img/dice-${diceNum}.png`; // Change image to Dice No.

    // Check for rolled 1, if true, switch to next player
    // delayed by 1 sec
    setTimeout(() => {
        if (diceNum !== 1) {
            // Add dice num. to the current score
            currentScore += diceNum;

            // Track and update Player & Current Score
            if (activePlayer === 1) {
                currentScore1.textContent = currentScore;
            } else {
                currentScore2.textContent = currentScore;
            };

        } else {
            // Switch to next player
            diceRoll1();
        };

    }, 1100);

});

// Hold Btn Function
btnHoldTurn.addEventListener('click', function () {
    // Switch Player & Update Player Score 
    holdFunction();
});

// Reset Game
btnNewGame.addEventListener('click', function () {
    // Reload Screen
    reloadScreen();

});

const reloadScreen = function () {

    loadingAnimation.classList.remove('hidden'); // Make Animation Visible

    // Impliment after 3 secs
    setTimeout(() => {
        location.reload(); //Reload entire page
        loadingAnimation.classList.add('hidden'); //Remove loading animation
    }, 3000);
};


