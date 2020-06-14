/**
 * Helper functions
 */
const _ = require('lodash');

/**
 * Get random delay and position for virus
 */
const getVirusState = () => {
	return {
		delay: _.random(1000, 4000),
		virusNr: _.random(1, 9),
		x: _.random(0, 20),
		y: _.random(0, 20),
	}
}

/**
 * Get player by room
 */
const getPlayer = (id, activeGames, gameId) => {
	return activeGames[gameId].players.find(player => player.id === id);
}

/**
 * Get opponent by room
 */
const getOpponent = (id, rooms, roomName) => {
	return rooms[roomName].players.find(player => player.id !== id);
}

/**
 * Get game ID
 */
const getGameId = (playerId, activeGames) => {
	const gameIds = Object.keys(activeGames);
	return gameIds.find(id => id.includes(playerId));
}

/**
 * Get winner
 */
const getWinner = (player, opponent) => {
	if (player.score === opponent.score) {
		return false;
	}

	return (player.score > opponent.score)
		? player
		: opponent;
}


module.exports = {
	getVirusState,
	getPlayer,
	getOpponent,
	getGameId,
	getWinner,
}
