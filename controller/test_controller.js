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
const findOpponent = (player) => {
	if (queue.length) {
		const opponent = queue.pop();

		// Init game room
		initGame(player, opponent);

	} else {
		// Add to queue
		queue.push(player);
		debug(`Player ${player.id} added to queue.`);
	}
};

const initGame = (player, opponent) => {
	debug('players', players);
	// Emit to start new game
	opponent.emit('init-game', {
		player: { id: opponent.id, username: players[opponent.id], score: 0 },
		opponent: { id: player.id, username: players[player.id], score: 0 }
	});

	player.emit('init-game', {
		player: { id: player.id, username: players[player.id], score: 0 },
		opponent: { id: opponent.id, username: players[opponent.id], score: 0 }
	});

	// show virus
	showVirus(player, opponent);
}

const showVirus = (player, opponent) => {
	const state = {
		delay: getRandomInt(1000, 4000),
		x: getRandomInt(0, 100),
		y: getRandomInt(0, 100)
	}

	// emit delay and positions to players
	player.emit('show-virus', state);
	opponent.emit('show-virus', state);
}

module.exports = (io) => {
	io.on('connection', socket => {

		/**
		 * Handle player disconnecting
		 */
		socket.on('disconnect', () => {
			debug(`Socket ${socket.id} left the game.`);

			// remove player from list of connected players
			delete players[socket.id];
		})

		/**
		 * Handle a new player connecting
		 */
		socket.on('register-player', (username) => {
			debug(`New player joined: ${username}`);

			// Save new player
			players[socket.id] = username;

			// Broadcast message while waiting for an opponent to joing
			socket.emit('waiting', { message: 'Waiting for another player to join...' });

			// Find opponent
			findOpponent(socket);
		});


		/**
		 * Broadcast players reaction time to opponent
		 */
		socket.on('reaction-time', (reactionTime) => {
			socket.reactionTime = reactionTime
			socket.broadcast.emit('opponent-time', reactionTime);
		});

		/**
		 * Compare reaction times
		 */
		socket.on('compare-time', (player, opponent) => {
			const score = player < opponent;
			socket.emit('update-score', score);
		})

	});
}


