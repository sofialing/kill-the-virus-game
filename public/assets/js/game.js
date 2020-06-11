const socket = io();

const startEl = document.querySelector('#start-form');
const virus = document.querySelector('#virus');

let username = null;
let playerId = null;

let gameRound = 0;
let timerInterval;
let startTime;
let reactionTime;

/**
 * Update game interface
 */
const updateUI = (opponentUsername) => {
	// update usernames
	document.querySelector('#player-username').innerHTML = username;
	document.querySelector('#opponent-username').innerHTML = opponentUsername;

	// hide waiting-message and show game area
	document.querySelector('#message').classList.add('hide');
	document.querySelector('#game').classList.remove('hide');
}

/**
 * Update timer
 */
const updateTimer = (id, time) => {
	document.querySelector(`#${id}`).innerHTML = moment(time).format('mm:ss.SSS');
}

/**
 * Start timer
 */
const startTimer = () => {
	startTime = Date.now();
	timerInterval = setInterval(function () {
		reactionTime = Date.now() - startTime;
		updateTimer('timer', reactionTime);
	});
}

/**
 * Get username and emit 'register-user'-event to server
 */
startEl.addEventListener('submit', e => {
	e.preventDefault();

	// prevent empty username
	if (!startEl.username.value) return;

	// save username and emit it to server
	username = startEl.username.value;
	socket.emit('register-player', username);

	// hide start section
	document.querySelector('#start').classList.add('hide');
});

/**
 * Handle click on virus and emit 'reaction-time'-event to server
 */
virus.addEventListener('click', e => {
	// stop Timer
	clearInterval(timerInterval);

	// hide virus and display players reaction time
	document.querySelector('#virus').classList.add('hide');
	updateTimer('player-timer', reactionTime);

	// emit reaction time to server
	socket.emit('virus-killed', { reactionTime, gameRound });
});

/**
 * Show message while waiting for another player to join
 */
socket.on('waiting', ({ message }) => {
	document.querySelector('#message-content').innerHTML = message;
	document.querySelector('#message').classList.remove('hide');
});

/**
 * Init game and update UI
 */
socket.on('init-game', ({ id, opponent }) => {
	// save socket ID
	playerId = id;

	// update game UI with usernames
	updateUI(opponent);
})

/**
 * Show virus and start timer
 */
socket.on('show-virus', ({ delay, x, y }) => {
	setTimeout(() => {
		// Update position and show virus
		document.querySelector('#virus').style.gridColumn = `${x} / span 1`;
		document.querySelector('#virus').style.gridRow = `${y} / span 1`;
		document.querySelector('#virus').classList.remove('hide');

		// Start timer
		startTimer();

	}, delay)
});

/**
 * Show opponents reaction time
 */
socket.on('show-reaction-time', (opponentReactionTime) => {
	updateTimer('opponent-timer', opponentReactionTime);
})

/**
 * Update score
 */
socket.on('update-score', ({ winnerId, score }) => {
	if (winnerId === playerId) {
		document.querySelector('#player-score').innerHTML = score;
	} else {
		document.querySelector('#opponent-score').innerHTML = score;
	}
})
