const socket = io();

const startEl = document.querySelector('#start-form');
const virus = document.querySelector('#virus');

let gameData = {};
let rounds = 0;
let timer = 0;
let startTime = 0;
let reactionTime = 0;


/**
 * Update timer
 */
const updateDisplay = (reactionTime) => {
	document.querySelector('#timer').innerHTML = moment(reactionTime).format('mm:ss.SSS');
}

/**
 * Update game interface
 */
const updateUI = (data) => {
	document.querySelector('#player-username').innerHTML = data.player.username;
	document.querySelector('#player-score').innerHTML = data.player.score;
	document.querySelector('#opponent-username').innerHTML = data.opponent.username;
	document.querySelector('#opponent-score').innerHTML = data.opponent.score;

	// Hide message and show game
	document.querySelector('#message').classList.add('hide');
	document.querySelector('#game').classList.remove('hide');
}

/**
 * Get username and emit 'register-user'-event to server
 */
startEl.addEventListener('submit', e => {
	e.preventDefault();
	socket.emit('register-player', document.querySelector('#username').value);

	// Hide start section
	document.querySelector('#start').classList.add('hide');
});

/**
 * Handle click on virus and emit 'reaction-time'-event to server
 */
virus.addEventListener('click', e => {
	// Stop Timer
	clearInterval(timer);

	// Hide virus and show reaction time
	document.querySelector('#virus').classList.add('hide');
	document.querySelector('#player-timer').innerHTML = moment(reactionTime).format('mm:ss.SSS');

	// Emit reaction time to server
	socket.emit('reaction-time', reactionTime);

	// // Reset reactionTime
	// reactionTime = 0;
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
socket.on('init-game', (data) => {
	gameData = data;
	updateUI(data);
	socket.emit('new-round');
	rounds++;
})

/**
 * Show virus and start timer
 */
socket.on('show-virus', (data) => {
	console.log(data);
	setTimeout(() => {
		document.querySelector('#virus').classList.remove('hide');
		document.querySelector('#virus').style.left = data.x > 90 ? '90%' : `${data.x}%`;
		document.querySelector('#virus').style.top = data.y > 90 ? '90%' : `${data.y}%`;
		startTime = Date.now();
		timer = setInterval(function () {
			reactionTime = Date.now() - startTime;
			updateDisplay(reactionTime);
		});
	}, data.delay)
});

/**
 * Show opponents reaction time
 */
socket.on('opponent-time', (opponentReactionTime) => {
	document.querySelector('#opponent-timer').innerHTML = moment(opponentReactionTime).format('mm:ss.SSS');
	if (reactionTime) {
		socket.emit('compare-time', reactionTime, opponentReactionTime);
	}
})

/**
 * Update score
 */
socket.on('update-score', (score) => {
	if (score) {
		gameData.player.score++;
		document.querySelector('#player-score').innerHTML = gameData.player.score;
	} else {
		gameData.opponent.score++;
		document.querySelector('#opponent-score').innerHTML = gameData.opponent.score;
	}
})
