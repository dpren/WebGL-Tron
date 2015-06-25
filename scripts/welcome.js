"use strict";

var startGame = function(e) {

	var inputEl = document.getElementById('usernameInput');
	var underline = document.getElementById('underline');
	var welcome = document.getElementById('welcome-msg');
	var countDown = document.getElementById('count-down');
	var username = inputEl.value.trim();

	if (!username) {

		inputEl.style.color = '#f55';
		underline.style.background = '#f55';
		return;
		
	} else {

		inputEl.style.color = '#8f8';
		underline.style.background = '#5f5';

		if (e.keyCode === 13) {

			inputEl.style.transition = ".3s ease";
			inputEl.style.color = '#9f9';
			underline.style.background = '#7f7';
			inputEl.style.textShadow = "0px 0px 10px rgba(140,255,250,0.7)";
			inputEl.blur();



			player1.name = username;
			player1.textLabel = username;
			//player1.playerID = activePlayers.length+1;
			player1.color = 0x0066dd;


			player1 = spawnCycle(player1, -300, -2, 1, false);
			otherPlayers[0] = spawnCycle(otherPlayers[0], 300, 0, 3, true);
			changeViewTargetTo(0);

			function start() {
				
				hideElement(welcome, inputEl);
				
				document.removeEventListener('keyup', startGame);
				document.addEventListener('keydown', handleKeyDown, false);
				document.addEventListener('keyup', handleKeyUp, false);
				THREEx.FullScreen.bindKey();

				pause();
			};
			setTimeout(start, 350);
		}
	}
};


var initGame = function() {

	camera.lookAt(player1.position);

	gauge.rubber.max.innerHTML = gauge.rubber.maxVal;
	//gauge.rubber.maxVal = maxRubber;
	gauge.speed.max.innerHTML = gauge.speed.maxVal;
	//gauge.speed.maxVal = maxSpeed;
	gauge.brakes.max.innerHTML = gauge.brakes.maxVal;
	//gauge.brakes.maxVal = maxBrakes;

	document.getElementById('usernameInput').focus();

	document.addEventListener('keyup', startGame);

	animate();
};

window.onload = function() {

	initGame();
};