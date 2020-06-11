// /**
//  * Socket Controller
//  */
const debug = require('debug')('kill-the-virus-game:socket_controller');
const io = require('../app').get('io');

const players = {};
const queue = [];
const rooms = {};

/**
 * Generate a random number between min and max
 */
const getRandomNumber = (max, min) => {
	return Math.floor(Math.random() * (max - min) + min);
}

const virusState = () => {
	return {
		delay: getRandomNumber(1000, 4000),
		x: getRandomNumber(0, 20),
		y: getRandomNumber(0, 20)
	}
}

/**
 * Find an opponent
 */
const findOpponent = (socket) => {
	if (queue.length) {
		const opponent = queue.pop();
		const room = `${socket.id}#${opponent.id}`;

		// join both players
		opponent.join(room);
		socket.join(room);

		// save room to both players socket ID
		rooms[opponent.id] = room;
		rooms[socket.id] = room;

		// init game room
		initGame(socket, opponent);

	} else {
		// add to queue
		queue.push(socket);
		debug(`Player ${socket.id} added to queue.`);
	}
};

const initGame = (socket, opponent) => {
	// save info about each others opponent
	players[socket.id].game.opponent = opponent.id;
	players[opponent.id].game.opponent = socket.id;

	// emit id and opponent username to both players
	socket.emit('init-game', {
		id: socket.id,
		opponent: players[opponent.id].username,
	});

	opponent.emit('init-game', {
		id: opponent.id,
		opponent: players[socket.id].username,
	});

	// emit delay and position of virus to both players
	io.in(rooms[socket.id]).emit('show-virus', virusState())
}

const updateScore = ({ winnerId }) => {
	// update score for the winner
	players[winnerId].game.score++;

	// emit winner ID and the updated score to both players
	io.emit('update-score', { winnerId, score: players[winnerId].game.score });
}

module.exports = socket => {
	debug(`Client ${socket.id} connected.`);

	/**
	 * Handle player disconnecting
	 */
	socket.on('disconnect', () => {
		debug(`Client ${socket.id} disconnected.`);

		// remove player from list of connected players
		if (players[socket.id]) delete players[socket.id];
	})

	/**
	 * Handle a new player connecting
	 */
	socket.on('register-player', (username) => {
		debug(`New player joined: ${username}`);

		// save new player
		players[socket.id] = {
			id: socket.id,
			username: username,
			game: {
				score: 0,
				reactionTime: []
			}
		};

		// broadcast message while waiting for an opponent to joing
		socket.emit('waiting', { message: 'Waiting for another player to join...' });

		// find opponent
		findOpponent(socket);
	});


	/**
	 * Broadcast players reaction time to opponent
	 */
	socket.on('virus-killed', ({ reactionTime, gameRound }) => {
		players[socket.id].game.reactionTime.push(reactionTime);
		socket.broadcast.emit('show-reaction-time', reactionTime);

		// check if opponent already have a reaction time saved for this round
		// if so, opponent won this round
		const opponentId = players[socket.id].game.opponent;
		if (players[opponentId].game.reactionTime[gameRound]) {
			updateScore({ winnerId: opponentId });
			// newRound({ player: socket.id, opponent, io });
		}

	});
};


