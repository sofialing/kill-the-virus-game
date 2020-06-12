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
		x: getRandomNumber(0, 20),
		y: getRandomNumber(0, 20)
	}
}

/**
 * Get username by socket
 */
const getUsername = (socket) => {
	return socket.playerDetails.username;
}

/**
 * Get player by room
 */
const getPlayer = (id, rooms, roomName) => {
	return rooms[roomName].players.find(player => player.id === id);
}

/**
 * Get opponent by room
 */
const getOpponent = (id, rooms, roomName) => {
	return rooms[roomName].players.find(player => player.id !== id);
}

module.exports = {
	getRandomNumber,
	getVirusState,
	getUsername,
	getPlayer,
	getOpponent
}
