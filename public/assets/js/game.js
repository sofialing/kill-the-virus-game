const socket = io();

const startEl = document.querySelector('#start-form');
const gameOverEl = document.querySelector('#game-over');
const virus = document.querySelector('#virus');

let username = null;
let playerId = null;
let gameId = null;

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
virus.addEventListener('click', () => {
	// stop Timer
	clearInterval(timerInterval);

	// hide virus and display players reaction time
	document.querySelector('#virus').classList.add('hide');
	updateTimer('player-timer', reactionTime);

	// emit reaction time to server
	socket.emit('virus-killed', { reactionTime, gameRound, gameId });
});

document.querySelector('#new-game').addEventListener('click', () => {
	gameOverEl.classList.remove('is-active');
	startEl.classList.remove('hiden');
	document.querySelector('#game').classList.add('hide');
	socket.emit('leave-game');
	socket.emit('register-player', username);

	gameRound = 0;

	// reset everything
	document.querySelector('#player-score').innerText = 0;
	document.querySelector('#opponent-score').innerText = 0;
	document.querySelector('#player-timer').innerHTML = '–';
	document.querySelector('#opponent-timer').innerHTML = '–';
	document.querySelector('#timer').innerText = '00:00.000';
	document.querySelector('#game-round').innerText = 1;

})

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
socket.on('init-game', (data) => {
	// save player ID and room name
	playerId = data.id;
	gameId = data.gameId;

	// update game UI with usernames
	updateUI(data.opponent);
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
socket.on('update-score', ({ winnerId, updatedScore }) => {
	if (winnerId === playerId) {
		document.querySelector('#player-score').innerHTML = updatedScore;
	} else {
		document.querySelector('#opponent-score').innerHTML = updatedScore;
	}
})


socket.on('new-round', ({ delay, x, y }) => {
	// update rounds
	gameRound++;
	document.querySelector('#game-round').innerHTML = gameRound + 1;

	// show virus
	setTimeout(() => {
		// Update position and show virus
		document.querySelector('#virus').style.gridColumn = `${x} / span 1`;
		document.querySelector('#virus').style.gridRow = `${y} / span 1`;
		document.querySelector('#virus').classList.remove('hide');

		// Start timer
		startTimer();

	}, delay)

})

socket.on('game-over', (winner) => {
	// stop Timer
	clearInterval(timerInterval);
	let result;

	if (!winner) {
		result = "It's a draw!";
	} else if (winner.id === playerId) {
		result = 'Congratulations, you won!';
	} else {
		result = 'Not fast enough, you lost!';
	}

	gameOverEl.classList.add('is-active');
	document.querySelector('#game-result').innerText = result;
})

socket.on('opponent-left-game', (data) => {
	console.log(data.message);
})
