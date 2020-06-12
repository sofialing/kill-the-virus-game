// /**
//  * Socket Controller
//  */
const debug = require('debug')('kill-the-virus-game:socket_controller');
const io = require('../app').get('io');

const maxGameRounds = 2;
const queue = [];
const activeGames = {};

const { getVirusState, getUsername, getPlayer, getOpponent, getWinner } = require('./game_controller');

/**
 * Pair player with another player
 */
const handleGameQueue = (socket) => {
	// check for waiting players
	if (queue.length) {
		// get opponent and join new game room
		joinGameRoom(socket, queue.pop());
		return;
	}

	// if no waiting player, add socket to queue
	queue.push(socket);
};

/**
 * Create new game room and add players to it
 */
const joinGameRoom = (socket, opponent) => {
	const gameId = `${socket.id}#${opponent.id}`;

	// join both players
	socket.join(gameId);
	opponent.join(gameId);

	// save to active games
	activeGames[gameId] = {
		players: [
			{ ...socket.playerDetails },
			{ ...opponent.playerDetails },
		]
	}

	debug('activeGames', activeGames);

	// init new game
	initGame(socket, opponent, gameId);
}

/**
 * Init a new game and emit to players
 */
const initGame = (socket, opponent, gameId) => {
	// emit details about the game to both players
	socket.emit('init-game', {
		gameId,
		id: socket.id,
		opponent: getUsername(opponent),
	});

	opponent.emit('init-game', {
		gameId,
		id: opponent.id,
		opponent: getUsername(socket),
	});

	// emit delay and position of virus to both players
	io.in(gameId).emit('show-virus', getVirusState())
}

/**
 * Update score and emit to players
 */
const updateScore = (player, opponent, gameId) => {
	let data;

	// compare reaction time and update score
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

		// try to pair with another player
		handleGameQueue(socket);
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
			const winner = getWinner(player, opponent);
			io.in(gameId).emit('game-over', winner);
			return;
		}

		// start new game round
		io.in(gameId).emit('new-round', getVirusState());
	});

	/**
	 * Leave game
	 */
	socket.on('leave-game', () => {
		// get game ID
		const gameIds = Object.keys(activeGames);
		const gameId = gameIds.find(id => id.includes(socket.id));

		// emit to other player
		socket.to(gameId).emit('opponent-left-game', { message: 'Opponent left the game.' });

		// delete room
		delete activeGames[gameId];
		debug('activeGames', activeGames);

	})
};


