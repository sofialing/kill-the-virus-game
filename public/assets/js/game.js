const socket = io();

// HTML elements
const startEl = document.querySelector('#start');
const startForm = document.querySelector('#start-form');
const messageEl = document.querySelector('#message');
const gameOverEl = document.querySelector('#game-over');
const virusEl = document.querySelector('#virus');
const newGameBtn = document.querySelector('#new-game');

// Player details
let username = null;
let playerId = null;

// Game details
let gameId = null;
let gameRound;
let timerInterval;
let startTime;
let reactionTime;

/**
 * Start timer
 */
const startTimer = () => {
	startTime = Date.now();
	timerInterval = setInterval(function () {
		reactionTime = Date.now() - startTime;
		updateTimer('#timer', reactionTime);
	});
}

/**
 * Get username and emit 'register-user'-event to server
 */
startForm.addEventListener('submit', e => {
	e.preventDefault();

	// prevent empty username
	if (!startForm.username.value) return;

	// save username and emit it to server
	username = startForm.username.value;
	socket.emit('register-player', username);

	// hide start section
	hideElement(startEl);
});

/**
 * Handle when player clicks on virus and emit reaction time
 */
virusEl.addEventListener('click', () => {
	// stop Timer
	clearInterval(timerInterval);

	// hide virus and update reaction time
	hideElement(virusEl);
	updateTimer('#player-timer', reactionTime);

	// emit reaction time to server
	socket.emit('virus-killed', reactionTime, gameRound, gameId);
})

/**
 * Handle start new game and emit to server
 */
newGameBtn.addEventListener('click', () => {
	socket.emit('delete-game');
	socket.emit('register-player', username);

	resetGameSection();
})


/**
 * Listen for events from the server
 */

// Display message while waiting for another player to join
socket.on('waiting', ({ message }) => {
	setInnerHTML('#message-content', message);
	displayElement(messageEl);
});

// Init new game and display the game section
socket.on('init-game', (data) => {
	playerId = data.id;
	gameId = data.gameId;
	gameRound = 1;

	// set and display game section
	setGameSection(username, data.opponent);
})

// Display virus and start timer
socket.on('show-virus', ({ delay, virusNr, x, y }) => {
	setTimeout(() => {
		// Update virus position
		updateVirusPosition(virusNr, x, y);

		// Start timer
		startTimer();

	}, delay)
});

// Update and display opponents reaction time
socket.on('show-reaction-time', opponentReactionTime => {
	updateTimer('#opponent-timer', opponentReactionTime);
})

// Update and display score
socket.on('update-score', ({ winnerId, updatedScore }) => {
	if (winnerId === playerId) {
		setInnerHTML('#player-score', updatedScore);
	} else {
		setInnerHTML('#opponent-score', updatedScore);
	}
})

// Start new game round
socket.on('new-round', ({ delay, virusNr, x, y }) => {
	// update number of rounds
	gameRound++;
	setInnerHTML('#game-round', gameRound);

	setTimeout(() => {
		// Update virus position
		updateVirusPosition(virusNr, x, y)

		// Start timer
		startTimer();

	}, delay)
})

// Display game over message
socket.on('game-over', (winner) => {
	// stop Timer
	clearInterval(timerInterval);

	let message;

	if (!winner) {
		message = "It's a draw!";
	} else if (winner.id === playerId) {
		message = 'Congratulations, you won!';
	} else {
		message = 'Not fast enough, you lost!';
	}

	gameOverEl.classList.add('is-active');
	setInnerHTML('#game-result', message);
})

// Display message about opponent left game
socket.on('opponent-left-game', (data) => {
	// stop timer
	clearInterval(timerInterval);

	// display modal box
	gameOverEl.classList.add('is-active');
	setInnerHTML('#game-result', data.message);
})
