/**
 * Socket Controller
 */
const debug = require('debug')('kill-the-virus-game:socket_controller');
const io = require('../app').get('io');

const activeGames = {};
const maxGameRounds = 5;
const queue = [];

const { getVirusState, getPlayer, getOpponent, getGameId, getWinner } = require('./game_controller');

/**
 * Pair player with another player
 */
const handleGameQueue = (player) => {
	// check for waiting players
	if (queue.length) {
		// get opponent and join new game room
		joinGameRoom(player, queue.pop());
		return;
	}

	// if no waiting player, add player to queue
	queue.push(player);

	// broadcast message while waiting for an opponent to join
	player.emit('waiting', { message: 'Waiting for another player to join...' });
};

/**
 * Create new game room and add players to it
 */
const joinGameRoom = (player, opponent) => {
	const gameId = `${player.id}#${opponent.id}`;

	// join both players
	player.join(gameId);
	opponent.join(gameId);

	// save to active games
	activeGames[gameId] = {
		players: [
			{ ...player.playerDetails },
			{ ...opponent.playerDetails },
		],
		onGoing: true,
	}

	// init new game
	initGame(player, opponent, gameId);
}

/**
 * Init a new game and emit to players
 */
const initGame = (player, opponent, gameId) => {
	player.emit('init-game', {
		id: player.id,
		opponent: opponent.playerDetails.username,
		gameId,
	});

	opponent.emit('init-game', {
		id: opponent.id,
		opponent: player.playerDetails.username,
		gameId,
	});

	// emit delay and position of virus to both players
	const virusState = getVirusState();
	io.in(gameId).emit('show-virus', virusState)
}

/**
 * Update score and emit to players
 */
const updateScore = (player, opponent, gameId) => {
	let data;

	// compare reaction time and update score
	if (player.reactionTime < opponent.reactionTime) {
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

/**
 * Handle new player connecting
 */
function registerPlayer(username) {
	debug(`New player joined: ${username}`);

	this.playerDetails = {
		id: this.id,
		username: username,
		score: 0,
		reactionTime: null
	}

	// try to pair with another player
	handleGameQueue(this);
}

/**
 * Handle player disconnecting
 */
function playerDisconnecting() {
	debug(`Client ${this.id} disconnected.`);

	// check if player is waiting in queue,
	const queueIndex = queue.findIndex(socket => socket.id === this.id);
	if (queueIndex !== -1) {
		queue.splice(queueIndex, 1);
		return;
	}

	// check if player has an active game
	const gameId = getGameId(this.id, activeGames);
	if (!gameId) {
		return;
	}

	// if ingoing game, emit message to opponent
	if (activeGames[gameId].onGoing) {
		this.to(gameId).emit('opponent-left-game', { message: 'Opponent left the game.' });
	}

	// delete game room
	delete activeGames[gameId];
}

/**
 * Handle virus killed and reaction times
 */
function virusKilled(reactionTime, gameRound, gameId) {
	// save reaction time
	const player = getPlayer(this.id, activeGames, gameId);
	player.reactionTime = reactionTime;

	// emit reaction time to opponent
	this.to(gameId).emit('show-reaction-time', reactionTime);

	// get opponents reaction time, return if null
	const opponent = getOpponent(this.id, activeGames, gameId);
	if (!opponent.reactionTime) {
		return;
	}

	// update score
	updateScore(player, opponent, gameId);

	// check if game is over and get winner
	if (gameRound === maxGameRounds) {
		const gameId = getGameId(this.id, activeGames);
		activeGames[gameId].onGoing = false;

		const winner = getWinner(player, opponent);
		io.in(gameId).emit('game-over', winner);

		return;
	}

	// emit delay and position of virus to both players
	const virusState = getVirusState();
	io.in(gameId).emit('new-round', virusState)
}

module.exports = socket => {
	debug(`Client ${socket.id} connected.`);

	socket.on('disconnect', playerDisconnecting);
	socket.on('register-player', registerPlayer);
	socket.on('virus-killed', virusKilled);
	socket.on('delete-game', playerDisconnecting);
};


