const messageSection = document.querySelector('#message');
const gameSection = document.querySelector('#game');

// Set innerHTML of element
const setInnerHTML = (element, content) => document.querySelector(element).innerHTML = content;

// Hide element
const hideElement = element => element.classList.add('hide');

// Display element
const displayElement = element => element.classList.remove('hide');

// Update timer
const updateTimer = (element, time) => {
	document.querySelector(element).innerHTML = moment(time).format('mm:ss.SSS');
}

// Update virus
const updateVirusPosition = (virusNr, x, y) => {
	virusEl.style.gridColumn = `${x} / span 1`;
	virusEl.style.gridRow = `${y} / span 1`;
	virusEl.src = `/assets/images/virus-${virusNr}.svg`
	displayElement(virusEl);
}

// Display game section and set usernames
const setGameSection = (username, opponent) => {
	setInnerHTML('#player-username', username);
	setInnerHTML('#opponent-username', opponent);

	hideElement(messageSection);
	displayElement(gameSection);
}

// Reset interface before starting new game
const resetGameSection = () => {
	hideElement(gameSection);
	gameOverEl.classList.remove('is-active');

	setInnerHTML('#timer', '00:00.000');
	setInnerHTML('#player-timer', '–');
	setInnerHTML('#opponent-timer', '–');
	setInnerHTML('#player-score', '0');
	setInnerHTML('#opponent-score', '0');
	setInnerHTML('#game-round', '1');
}




