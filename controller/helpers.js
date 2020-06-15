/**
 * Helper functions
 */
const _ = require('lodash');

/**
 * Get game ID
 */
const getGameId = (playerId, activeGames) => {
	const gameIds = Object.keys(activeGames);
	return gameIds.find(id => id.includes(playerId));
}

/**
 * Get opponent by room
 */
const getOpponent = (id, gameId, activeGames) => {
	return activeGames[gameId].players.find(player => player.id !== id);
}

/**
 * Get player by room
 */
const getPlayer = (id, gameId, activeGames) => {
	return activeGames[gameId].players.find(player => player.id === id);
}

/**
 * Get updated score
 */
const getUpdatedScore = (player, opponent) => {
	if (player.reactionTime < opponent.reactionTime) {
		player.score++;
		return { winnerId: player.id, score: player.score };
	} else {
		opponent.score++;
		return { winnerId: opponent.id, score: opponent.score };
	}
}

/**
 * Get winner
 */
const getWinner = (player, opponent) => {
	if (player.score < opponent.score) {
		return opponent;
	} else if (opponent.score < player.score) {
		return player;
	}

	return false;
}

/**
 * Get random delay and position for virus
 */
const getVirusState = () => {
	return {
		delay: _.random(1000, 4000),
		nr: _.random(1, 9),
		x: _.random(0, 20),
		y: _.random(0, 20),
	}
}

module.exports = {
	getGameId,
	getOpponent,
	getPlayer,
	getUpdatedScore,
	getVirusState,
	getWinner
}
