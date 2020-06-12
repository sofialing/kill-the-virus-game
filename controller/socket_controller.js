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
		const roomName = `${socket.id}#${opponent.id}`;

		// join both players
		socket.join(roomName);
		opponent.join(roomName);

		// add new room and save players details
		rooms[roomName] = {
			players: [
				{ ...socket.playerDetails },
				{ ...opponent.playerDetails },
			]
		}

		// init game room
		initGame(socket, opponent, roomName);

	} else {
		// add to queue
		queue.push(socket);
		debug(`Player ${socket.id} added to queue.`);
	}
};

const getUsername = (socket) => {
	return socket.playerDetails.username;
}

const getPlayer = (playerId, roomName) => {
	return rooms[roomName].players.find(player => player.id === playerId);
}

const getOpponent = (playerId, roomName) => {
	return rooms[roomName].players.find(player => player.id !== playerId);
}

const initGame = (socket, opponent, room) => {
	// emit id and opponent username to both players
	socket.emit('init-game', {
		id: socket.id,
		opponent: getUsername(opponent),
		room,
	});

	opponent.emit('init-game', {
		id: opponent.id,
		opponent: getUsername(socket),
		room
	});

	// emit delay and position of virus to both players
	io.in(room).emit('show-virus', virusState())
}

const updateScore = (player, opponent, room) => {
	// compare reaction time
	if (player.reactionTime < player.reactionTime) {
		player.score++;
		player.reactionTime = null;

		io.in(room).emit('update-score', { winnerId: player.id, score: player.score })
	} else {
		opponent.score++;
		opponent.reactionTime = null;

		io.in(room).emit('update-score', { winnerId: opponent.id, score: opponent.score })
	}
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

		socket.playerDetails = {
			id: socket.id,
			username: username,
			score: 0,
			reactionTime: null
		}

		// broadcast message while waiting for an opponent to joing
		socket.emit('waiting', { message: 'Waiting for another player to join...' });

		// find opponent
		findOpponent(socket);
	});


	/**
	 * Broadcast players reaction time to opponent
	 */
	socket.on('virus-killed', ({ reactionTime, room }) => {
		// save reaction time
		const player = getPlayer(socket.id, room);
		player.reactionTime = reactionTime;

		// emit reaction time to opponent
		socket.to(room).emit('show-reaction-time', reactionTime);

		// check for opponent reaction from current game round
		const opponent = getOpponent(socket.id, room);
		if (opponent.reactionTime) {
			updateScore(player, opponent, room);
		}
	});
};


