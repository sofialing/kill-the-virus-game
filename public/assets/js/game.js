const socket = io();

// HTML elements
const gameOverEl = document.querySelector('#game-over');
const messageEl = document.querySelector('#message');
const newGameBtn = document.querySelector('#new-game');
const startEl = document.querySelector('#start');
const startForm = document.querySelector('#start-form');
const virusEl = document.querySelector('#virus');

// Player details
let playerId = null;
let username = null;

// Game details
let reactionTime;
let startTime;
let timerInterval;

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
	socket.emit('virus-killed', reactionTime);
})

/**
 * Handle start new game and emit to server
 */
newGameBtn.addEventListener('click', () => {
	socket.emit('player-left');
	socket.emit('register-player', username);

	resetGameSection();
});


/**
 * Listen for events from the server
 */

// Display virus and start timer
socket.on('display-virus', ({ delay, nr, x, y }, gameRound = 1) => {
	// set current game round
	setInnerHTML('#game-round', gameRound);

	setTimeout(() => {
		// update virus position
		updateRandomVirus(nr, x, y);

		// start timer
		startTimer();

	}, delay)
});

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
});

// Start new game and display the game section
socket.on('start-new-game', (data) => {
	playerId = data.id;

	setGameSection(username, data.opponent);
});

// Display message about opponent left game
socket.on('opponent-left-game', (data) => {
	// stop timer
	clearInterval(timerInterval);

	// hide virus and display modal box
	hideElement(virusEl);
	setInnerHTML('#game-result', data.message);
	gameOverEl.classList.add('is-active');
});

// Update and display opponents reaction time
socket.on('update-reaction-time', opponentReactionTime => {
	updateTimer('#opponent-timer', opponentReactionTime);
});

// Display updated score
socket.on('update-score', ({ winnerId, score }) => {
	if (winnerId === playerId) {
		setInnerHTML('#player-score', score);
	} else {
		setInnerHTML('#opponent-score', score);
	}
});

// Display message while waiting for another player to join
socket.on('waiting', ({ message }) => {
	setInnerHTML('#message-content', message);
	displayElement(messageEl);
});

// Handle player reconnecting
const handlePlayerReconnected = () => {
	if (!username) return;

	// stop timer
	clearInterval(timerInterval);

	// clear and hide game section
	hideElement(gameSection);
	hideElement(virusEl);
	resetGameSection();

	// notify player
	setInnerHTML('#message-content', 'Lost connection to server, reconnecting...');
	displayElement(messageEl);

	// register player again
	setTimeout(() => {
		socket.emit('register-player', username);
	}, 2000)
}

socket.on('reconnect', () => {
	handlePlayerReconnected();
});
