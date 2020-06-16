// HTML elements
const gameEl = document.querySelector('#game');
const gameOverEl = document.querySelector('#game-over');
const messageEl = document.querySelector('#message');
const newGameBtn = document.querySelector('#new-game');
const startEl = document.querySelector('#start');
const startForm = document.querySelector('#start-form');
const virusEl = document.querySelector('#virus');

// Display element
const displayElement = (element) => {
	element.classList.remove('hide');
};

// Hide element
const hideElement = (element) => {
	element.classList.add('hide');
};

// Reset interface before starting new game
const resetGameSection = () => {
	hideElement(gameEl);
	hideElement(virusEl);
	gameOverEl.classList.remove('is-active');

	setInnerHTML('#timer', '00:00.000');
	setInnerHTML('#player-timer', '–');
	setInnerHTML('#opponent-timer', '–');
	setInnerHTML('#player-score', '0');
	setInnerHTML('#opponent-score', '0');
	setInnerHTML('#game-round', '1');
}

// Display game section and set usernames
const setGameSection = (username, opponent) => {
	setInnerHTML('#player-username', username);
	setInnerHTML('#opponent-username', opponent);

	hideElement(messageEl);
	displayElement(gameEl);
}

// Set innerHTML of element
const setInnerHTML = (element, content) => {
	document.querySelector(element).innerHTML = content;
};

// Update random virus
const updateRandomVirus = (virusNr, x, y) => {
	virusEl.style.gridColumn = `${x} / span 1`;
	virusEl.style.gridRow = `${y} / span 1`;
	virusEl.src = `/assets/images/virus-${virusNr}.svg`

	displayElement(virusEl);
}

// Update timer
const updateTimer = (element, time) => {
	document.querySelector(element).innerHTML = moment(time).format('mm:ss.SSS');
}
