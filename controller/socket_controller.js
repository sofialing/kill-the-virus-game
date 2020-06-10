// /**
//  * Socket Controller
//  */
const debug = require('debug')('kill-the-virus-game:socket_controller');

const players = {};
const queue = [];
const rooms = {};

/**
 * Generate a random number between min and max
 */
const getRandomInt = (max, min) => {
	return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Find an opponent
 */
const findOpponent = (socket) => {
	if (queue.length) {
		const opponent = queue.pop();

		// Emit to start new game
		opponent.emit('start-game', { player: players[opponent.id], opponent: players[socket.id] });
		socket.emit('start-game', { player: players[socket.id], opponent: players[opponent.id] });

		const data = {
			delay: getRandomInt(1000, 4000),
			x: getRandomInt(0, 100),
			y: getRandomInt(0, 100)
		}

		// show virus
		opponent.emit('show-virus', data);
		socket.emit('show-virus', data);

	} else {
		// Add to queue
		queue.push(socket);
		debug('Player added to queue:', queue);
	}
};

/**
 * Handle player disconnecting
 */
function handlePlayerDisconnecting() {
	debug(`Socket ${this.id} left the game.`);

	// remove player from list of connected players
	delete players[this.id];
}

/**
 * Handle a new player connecting
 */
function handleRegisterPlayer(username) {
	debug(`New player joined: ${username}`);

	// Save new player
	players[this.id] = username;
	debug('players', players);

	// Broadcast message while waiting for an opponent to joing
	this.emit('waiting', { message: 'Waiting for another player to join...' });

	// Find opponent
	findOpponent(this);
}

function handleReactionTime(data) {
	this.broadcast.emit('opponent-time', data);
}


module.exports = function (socket) {
	debug(`New client connected: ${socket.id}`);

	socket.on('disconnect', handlePlayerDisconnecting)
	socket.on('register-player', handleRegisterPlayer);
	socket.on('reaction-time', handleReactionTime);
}
