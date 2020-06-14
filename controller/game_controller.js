/**
 * Helper functions
 */

/**
 * Generate a random number between min and max
 */
const getRandomNumber = (max, min) => {
	return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Get random delay and position for virus
 */
const getVirusState = () => {
	return {
		delay: getRandomNumber(1000, 4000),
		virusNr: getRandomNumber(1, 9),
		x: getRandomNumber(0, 20),
		y: getRandomNumber(0, 20),
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
	getRandomNumber,
	getVirusState,
	getPlayer,
	getOpponent,
	getGameId,
	getWinner,
}
