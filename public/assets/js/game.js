const socket = io();

// Player details
let playerId = null;
let username = null;

// Game details
let reactionTime;
let startTime;
let timerInterval;

/**
 * Display message while waiting for another player to join
 */
const displayMessage = ({ message }) => {
	setInnerHTML('#message-content', message);
	displayElement(messageEl);
}

/**
 * Display random virus and start timer
 */
const displayVirus = ({ delay, nr, x, y }, gameRound = 1) => {
	// set current game round
	setInnerHTML('#game-round', gameRound);

	setTimeout(() => {
		// update virus position
		updateRandomVirus(nr, x, y);

		// start timer
		startTimer();

	}, delay)
}

/**
 * Handle game over and display message
 */
const handleGameOver = (winner) => {
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

	// display modal box with message
	gameOverEl.classList.add('is-active');
	setInnerHTML('#game-result', message);
}

/**
 * Notify player that the opponent has left the game
 */
const handleOpponentLeft = (data) => {
	// stop timer and remove virus
	clearInterval(timerInterval);
	hideElement(virusEl);

	// display modal box with message
	setInnerHTML('#game-result', data.message);
	gameOverEl.classList.add('is-active');
}

/**
 * Handle player reconnecting: reset game and re-register player
 */
const handlePlayerReconnected = () => {
	if (!username) return;

	// stop timer
	clearInterval(timerInterval);

	// reset game section
	resetGameSection();

	// notify player
	displayMessage({ message: 'Lost connection to server, reconnecting...' })

	// register player again
	setTimeout(() => {
		socket.emit('register-player', username);
	}, 2000)
}

/**
 * Prepare to start new game and display game section
 */
const startNewGame = ({ id, opponent }) => {
	playerId = id;
	setGameSection(username, opponent);
}

/**
 * Start timer
 */
const startTimer = () => {
	startTime = Date.now();
	timerInterval = setInterval(() => {
		reactionTime = Date.now() - startTime;
		updateTimer('#timer', reactionTime);
	});
}

/**
 * Update opponents reaction timer
 */
const updateOpponentTimer = (time) => {
	updateTimer('#opponent-timer', time);
}

/**
 * Update scoreboard
 */
const updateScoreboard = ({ winnerId, score }) => {
	if (winnerId === playerId) {
		setInnerHTML('#player-score', score);
	} else {
		setInnerHTML('#opponent-score', score);
	}
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

	// hide virus and display player reaction time
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

	// reset game section
	resetGameSection();
});


/**
 * Listen for events from the server
 */
socket.on('display-virus', displayVirus);
socket.on('game-over', handleGameOver);
socket.on('opponent-left-game', handleOpponentLeft);
socket.on('reconnect', handlePlayerReconnected);
socket.on('start-new-game', startNewGame);
socket.on('update-opponent-timer', updateOpponentTimer);
socket.on('update-scoreboard', updateScoreboard);
socket.on('waiting-for-opponent', displayMessage);
