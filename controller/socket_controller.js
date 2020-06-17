/**
 * Socket Controller
 */
const debug = require('debug')('kill-the-virus-game:socket_controller');
const io = require('../app').get('io');

const activeGames = {};
const playQueue = [];
const maxGameRounds = 10;

const { getGameId, getOpponent, getPlayer, getRandomVirus, getUpdatedScore, getWinner } = require('./helpers');

/**
 * Pair player with another player
 */
const matchPlayers = (player) => {
	// check for waiting player and join new game room
	if (playQueue.length) {
		joinGameRoom(player, playQueue.pop());
		return;
	}

	// if no waiting player, add player to queue
	playQueue.push(player);

	// broadcast message while waiting for an opponent to join
	player.emit('waiting-for-opponent', { message: 'Waiting for another player to join...' });
};

/**
 * Create new game room and let players join it
 */
const joinGameRoom = (player1, player2) => {
	const gameId = `${player1.id}#${player2.id}`;

	// join both players
	player1.join(gameId);
	player2.join(gameId);

	// save to active games
	activeGames[gameId] = {
		players: [
			{ ...player1.playerData },
			{ ...player2.playerData },
		],
		gameRound: 1,
	}

	// start new game
	startNewGame(player1, player2, gameId);
}

/**
 * Init a new game and emit to players
 */
const startNewGame = (player1, player2, gameId) => {
	player1.emit('start-new-game', {
		id: player1.id,
		opponent: player2.playerData.username,
	});

	player2.emit('start-new-game', {
		id: player2.id,
		opponent: player1.playerData.username,
	});

	// emit delay and random virus
	io.in(gameId).emit('display-virus', getRandomVirus());
}

/**
 * Start new game round
 */
const startNewGameRound = (gameId) => {
	// reset players reaction times to null
	activeGames[gameId].players.forEach(player => player.reactionTime = null);

	// update the number of rounds played
	activeGames[gameId].gameRound++;

	// emit delay, random virus and number of rounds played
	io.in(gameId).emit('display-virus', getRandomVirus(), activeGames[gameId].gameRound);
}

/**
 * Handle new player connecting
 */
function handleRegisterPlayer(username) {
	debug(`New player joined: ${username}`);

	this.playerData = {
		id: this.id,
		username: username,
		score: 0,
		reactionTime: null
	}

	// try to match with another player
	matchPlayers(this);
}

/**
 * Handle player disconnecting
 */
function handlePlayerDisconnecting() {
	debug(`Client ${this.id} disconnected.`);

	// if player is waiting in the queue, remove it
	const queueIndex = playQueue.findIndex(socket => socket.id === this.id);
	if (queueIndex !== -1) {
		playQueue.splice(queueIndex, 1);
		return;
	}

	// check if player has an active game, return if null
	const gameId = getGameId(this.id, activeGames);
	if (!gameId) return;

	// notify the opponent
	this.to(gameId).emit('opponent-left-game', { message: 'Opponent left the game.' });

	// delete the game from list of active games
	delete activeGames[gameId];
}

/**
 * Handle reaction times, get the winner and update score
 */
function handleVirusKilled(reactionTime) {
	const gameId = getGameId(this.id, activeGames);

	// save players reaction time
	const player = getPlayer(this.id, gameId, activeGames);
	player.reactionTime = reactionTime;

	// emit reaction time to opponent
	this.to(gameId).emit('update-opponent-timer', reactionTime);

	// get opponents reaction time, return if null
	const opponent = getOpponent(this.id, gameId, activeGames);
	if (!opponent.reactionTime) return;

	// emit updated score to players
	io.in(gameId).emit('update-scoreboard', getUpdatedScore(player, opponent));

	// check if game is over and emit the winner
	if (activeGames[gameId].gameRound === maxGameRounds) {
		io.in(gameId).emit('game-over', getWinner(player, opponent));

		// delete the game from list of active games
		delete activeGames[gameId];

		return;
	}

	// start new game round
	startNewGameRound(gameId);
}

module.exports = socket => {
	debug(`Client ${socket.id} connected.`);

	socket.on('disconnect', handlePlayerDisconnecting);
	socket.on('register-player', handleRegisterPlayer);
	socket.on('virus-killed', handleVirusKilled);
};
