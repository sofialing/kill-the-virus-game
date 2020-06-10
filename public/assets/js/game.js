const socket = io();

const startEl = document.querySelector('#start-form');
const virus = document.querySelector('#virus');

let username = null;

const updateUI = (data) => {
	document.querySelector('#message').classList.add('hide');
	document.querySelector('#game').classList.remove('hide');
	document.querySelector('#opponent-username').innerHTML = data.opponent;
	document.querySelector('#player-username').innerHTML = data.player;
}

startEl.addEventListener('submit', e => {
	e.preventDefault();
	username = document.querySelector('#username').value;
	socket.emit('register-player', username);

	document.querySelector('#start').classList.add('hide');
})

virus.addEventListener('click', e => {
	console.log(`${username} clicked virus!`);
})

socket.on('waiting', ({ message }) => {
	document.querySelector('#message').classList.remove('hide');
	document.querySelector('#message-content').innerHTML = message;
})

socket.on('start-game', (data) => {
	updateUI(data);
})
