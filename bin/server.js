/**
 * Module dependencies.
 */

require('dotenv').config();

const app = require('../app');
const debug = require('debug')('kill-the-virus-game:server');
const http = require('http');
const SocketIO = require('socket.io');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);
const io = SocketIO(server);

const players = {};
const queue = [];

// Find opponent
const findOpponents = (socket) => {
	if (queue.length) {
		const opponent = queue.pop();
		debug('Player removed from queue:', queue);

		// Emit to start new game
		opponent.emit('start-game', { player: players[opponent.id], opponent: players[socket.id] });
		socket.emit('start-game', { player: players[socket.id], opponent: players[opponent.id] });

	} else {
		// Add to queue
		queue.push(socket);
		debug('Player added to queue:', queue);
	}
};


io.on('connection', (socket) => {
	debug(`Client ${socket.id} connected.`);

	// Handle player disconnecting
	socket.on('disconnect', () => {
		debug(`Socket ${socket.id} left the game.`);

		// remove player from list of connected players
		delete players[socket.id];
	})

	// Handle new player connecting
	socket.on('register-player', (username) => {
		debug(`New player joined: ${username}`);

		// Save new player
		players[socket.id] = username;

		// Broadcast message while waiting for an opponent to joing
		socket.emit('waiting', { message: 'Waiting for another player to join...' });

		// Find opponent
		findOpponents(socket);
	})


});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	debug('Listening on ' + bind);
}
