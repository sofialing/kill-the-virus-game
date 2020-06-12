// /**
//  * Socket Controller
//  */
const debug = require('debug')('kill-the-virus-game:socket_controller');
const io = require('../app').get('io');

const queue = [];
const activeGames = {};
const maxGameRounds = 3;

const { getVirusState, getUsername, getPlayer, getOpponent } = require('./game_controller');


/**
 * Find an opponent
 */
const findOpponent = (socket) => {
	if (queue.length) {
		const opponent = queue.pop();
		const gameId = `${socket.id}#${opponent.id}`;

		// join both players
		socket.join(gameId);
		opponent.join(gameId);

		// add new game and save players details
		activeGames[gameId] = {
			players: [
				{ ...socket.playerDetails },
				{ ...opponent.playerDetails },
			]
		}

		// init game room
		initGame(socket, opponent, gameId);

	} else {
		// add player to queue
		queue.push(socket);
		debug(`Player ${socket.id} added to queue.`);
	}
};

/**
 * Init a new game and emit to players
 */
const initGame = (socket, opponent, gameId) => {
	// emit id and opponent username to both players
	socket.emit('init-game', {
		id: socket.id,
		opponent: getUsername(opponent),
		gameId,
	});

	opponent.emit('init-game', {
		id: opponent.id,
		opponent: getUsername(socket),
		gameId
	});

	// emit delay and position of virus to both players
	io.in(gameId).emit('show-virus', getVirusState())
}

const updateScore = (player, opponent, gameId) => {
	let data;

	// compare reaction time
	if (player.reactionTime < player.reactionTime) {
		player.score++;
		data = { winnerId: player.id, updatedScore: player.score };
	} else {
		opponent.score++;
		data = { winnerId: opponent.id, updatedScore: opponent.score };
	}

	// reset reaction times to null
	player.reactionTime = null;
	opponent.reactionTime = null;

	// emit new score to both players
	io.in(gameId).emit('update-score', data);
}

module.exports = socket => {
	debug(`Client ${socket.id} connected.`);

	/**
	 * Handle player disconnecting
	 */
	socket.on('disconnect', () => {
		debug(`Client ${socket.id} disconnected.`);

		// remove player from list of connected players
		// if (players[socket.id]) delete players[socket.id];
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
	socket.on('virus-killed', data => {
		const { gameId, reactionTime, gameRound } = data;

		// save reaction time
		const player = getPlayer(socket.id, activeGames, gameId);
		player.reactionTime = reactionTime;

		// emit reaction time to opponent
		socket.to(gameId).emit('show-reaction-time', reactionTime);

		// check for opponent reaction from current game round
		const opponent = getOpponent(socket.id, activeGames, gameId);
		if (!opponent.reactionTime) {
			return;
		}

		// update score
		updateScore(player, opponent, gameId);

		// check if game is over
		if (gameRound === maxGameRounds) {
			io.in(gameId).emit('game-over');
			return;
		}

		// start new game round
		io.in(gameId).emit('new-round', getVirusState());
	});
};


