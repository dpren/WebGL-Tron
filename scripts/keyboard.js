"use strict";

var handleKeyDown = function(e) {

	if (e.repeat) {
		if (paused && e.keyCode === 187) {
			animateOneFrame();
		}
		return;
	}

	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83: 	
		case 65: 	
					player1.turnQueue.push(turnLeft(player1));
					break;

		case 74: // right
		case 75:
		case 76:
		case 186:   
					player1.turnQueue.push(turnRight(player1));
					break;

		case 32: // space
					player1.braking = true;
					break;
		case 66: // b
					player1.boosting = true;
					break;

		case 80: // p
					pause();
					break;
		case 67: // c
					view += 1;
					if (view > 5) {
						view = 0;
						fixCockpitCam();
						if (paused === false) {
							activePlayers.forEach( function (cycle) {
								cycle.audio.gain.setTargetAtTime(6, ctx.currentTime, 1.0);
								cycle.textLabel.style.visibility = 'visible';
								if (!altCycleModel) {
									cycle.model.visible = true;
								}
							});
						}
					}
					break;
		case 90: // z
					if (player1.respawnAvailable === true) {
						player1.turnQueue = []; // clear in case turn keys were pressed while dead
						
						var spawnCheck = function() {

							var randX = Math.max(-arenaSize + 20,  Math.min(-200, (Math.random() * arenaSize - arenaSize)));
							var randZ = (Math.random() * arenaSize*2 - arenaSize)/2;

							var offset = new THREE.Vector3( randX, 0, randZ );
							var offset2 = new THREE.Vector3( randX+150, 0, randZ );
							var spawnCollision = detectCollisionsBetween(player1, offset, offset2, true);

							return (function() {
								
								if (spawnCollision) {
									return spawnCheck();

								} else {
									return {
										x: randX,
										z: randZ
									};
								}
							}());
						};

						var spawn = spawnCheck();

						player1 = spawnCycle(player1, spawn.x, spawn.z, 1, false);
						
						fixCockpitCam();
					}
					break;
		case 88: // x
					(function () {
						// spawn first available player in list
						var i = R.findIndex(R.propEq('respawnAvailable', true))(otherPlayers);
						if (i >= 0) {
							otherPlayers[i] = spawnCycle(otherPlayers[i], 300, i*12-12, 3, true)
						}

					}());
					break;
		case 220: // \|
					var alivePlayersLength = R.findLastIndex(R.propEq('alive', true))(activePlayers);
					if (alivePlayersLength >= 0) {

						crash(R.findLast(R.propEq('alive', true))(activePlayers));
					}
					break;
		case 73: // i
					showInfo = !showInfo;
					if (showInfo) {
						stats.domElement.style.visibility="visible";
						player1.add(distLine);
						player1.add(distLine2);
						player1.add(stopLine);
						player1.add(accelBoundingLine);
						player1.renderList.push(animateInfoMetrics(player1));
					} else {
						stats.domElement.style.visibility="hidden";
						player1.remove(distLine);
						player1.remove(distLine2);
						player1.remove(stopLine);
						player1.remove(accelBoundingLine);
						player1.renderList.splice(player1.renderList.indexOf(animateInfoMetrics(player1)), 1);
					}
					break;
		case 219: // [
					panningModel = "equalpower";
					activePlayers.forEach( function (cycle) {
						cycle.audio.panner.panningModel = "equalpower";
					});
					break;
		case 221: // ]
					panningModel = "HRTF";
					activePlayers.forEach( function (cycle) {
						cycle.audio.panner.panningModel = "HRTF";
					});
					break;
		case 188: // <
					if (activePlayers.length > 0) {
						changeViewTargetTo(viewTarget+1);
						fixCockpitCam();
					}
					break;
		case 190: // >
					if (activePlayers.length > 0) {
						changeViewTargetTo(viewTarget-1);
						fixCockpitCam();
					}
					break;
		case 192: // ~`
					player1.AI = !player1.AI;
					if (player1.AI) {
						player1.add(indicator);
						player1.renderList.push(chatIndicator);
					} else {
						player1.remove(indicator);
						player1.renderList.splice(player1.renderList.indexOf(chatIndicator), 1);
					}
					break;
		case 84: // t
					textureBlending = !textureBlending;
					break;
		case 49: // 1
					textureSource = 'images/dir_wall.png';
					break;
		case 50: // 2
					textureSource = 'images/legacy.png';
					break;
		case 51: // 3
					textureSource = 'images/white.png';
					break;
		case 53: // 5
					altCycleModel = !altCycleModel
					if (altCycleModel) {
						activePlayers.forEach( function (cycle) {
							cycle.model.visible = false;
						    cycle.children[1].visible = true;
						});
					} else {
						activePlayers.forEach( function (cycle) {
							cycle.model.visible = true;
							cycle.children[1].visible = false;
						});
					}
					break;
		case 48: // 0
					gridHQ = !gridHQ;
					createGrid(gridHQ);
					break;
		case 187: // +
					if (paused) {
						animateOneFrame();
					}
					break;
		case 8:	// delete
		case 9: // tab
					if (!paused) {
						e.preventDefault();
					}
					break;
    }
};

var handleKeyUp = function(e) {
	switch ( e.keyCode ) {

		case 32: // space
					player1.braking = false;
					break;
		case 66: // b
					player1.boosting = false;
					break;
	}
};
