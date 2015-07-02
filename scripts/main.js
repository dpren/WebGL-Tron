"use strict";


var cycleConfig = {
	x:  -320,
	z: -2,
	dir: 0,
	colorCode: 0x0044ff,
	engineType: 0,
	ai: false,
	playerID: 1,
	name: "player 1"
};


var player1 = createLightcycle(cycleConfig);
otherPlayers.push(createLightcycle({ x:0, z:0, dir:0, colorCode:0xff6600, engineType:1, ai:true, playerID:2, name:"player 2" }));
otherPlayers.push(createLightcycle({ x:0, z:0, dir:0, colorCode:0x44ff00, engineType:2, ai:true, playerID:3, name:"player 3" }));
otherPlayers.push(createLightcycle({ x:0, z:0, dir:0, colorCode:0x00dddd, engineType:3, ai:true, playerID:4, name:"player 4" }));
otherPlayers.push(createLightcycle({ x:0, z:0, dir:0, colorCode:0xdd0099, engineType:4, ai:true, playerID:5, name:"player 5" }));







var explosions = [];

var ExplodeAnimation = function(cycle) {
	var dirs = [];
	var geometry = new THREE.Geometry();

	var s1 = maxSpeed / cycle.speed;
	var s2 = cycle.speed / maxSpeed;
	var dir = cycle.clone().rotateY(-halfPi).getWorldDirection().round().addScalar( s1 ).multiplyScalar( s2 );

	for (var i = 0; i < explode.particleCount; i ++) { 
		var vertex = new THREE.Vector3(cycle.position.x, cycle.position.y, cycle.position.z);

		geometry.vertices.push( vertex );
		dirs.push({
			x: (Math.random() * explode.velocity) - (explode.velocity / 2) * dir.x,
			y: (Math.random() * explode.velocity) - (explode.velocity / 2),
			z: (Math.random() * explode.velocity) - (explode.velocity / 2) * dir.z
		});
	}

	var material = new THREE.PointCloudMaterial( { size: explode.particleSize,  color: cycle.color, transparent: true });
	var particles = new THREE.PointCloud( geometry, material );

	this.object = particles;
	this.status = true;

	this.xDir = (Math.random() * explode.velocity) - (explode.velocity / 2);
	this.yDir = (Math.random() * explode.velocity) - (explode.velocity / 2);
	this.zDir = (Math.random() * explode.velocity) - (explode.velocity / 2);

	scene.add( this.object ); 

	this.time = explode.time;

	this.update = function(){
		this.time *= explode.decay;

		if (this.status == true) {
			var pCount = explode.particleCount;
			while (pCount--) {
				var particle =  this.object.geometry.vertices[pCount]
				particle.y += dirs[pCount].y;
				particle.x += dirs[pCount].x;
				particle.z += dirs[pCount].z;
				this.object.material.size = this.time * explode.particleSize;
				this.object.material.opacity = this.time;
			}
			this.object.geometry.verticesNeedUpdate = true;
		}
	};

};






var addWall = function (cycle) {
	// contains 2 sub-children: wall and line
	cycle.currentWall = createWall(cycle.color);
	cycle.currentWall.quaternion.copy(cycle.quaternion);
	cycle.currentWall.position.x = cycle.position.x;
	cycle.currentWall.position.z = cycle.position.z;
	cycle.currentWall.scale.x = 0.0001;

	cycle.walls.add(cycle.currentWall);
};



var spawnCycle = function(cycle, x, z, dir, ai) {

	cycle = createLightcycle({
		x: x,
		z: z,
		dir: dir,
		colorCode: cycle.color,
		engineType: cycle.engineType,
		ai: ai,
		playerID: cycle.playerID,
		name: cycle.name
	});


	scene.add(cycle);

	cycle.textLabel = createLabel(cycle.name);

	cycle.respawnAvailable = false;

	cycle.renderList.push(animateCycle(cycle));
	cycle.renderList.push(fadeInLabel(cycle));

	cycle.rand = 3.8 - cycle.playerID/6;


	return (function () {

		addWall(cycle);

		cycle.engineSound = playSound(bufferLoader.bufferList[cycle.engineType], 0.5, 1, true, cycle.audio);
		cycle.audio.gain.setTargetAtTime(6, ctx.currentTime, 1.0);
		audioMixing(cycle);

		activePlayers.push(cycle);

		if (cycle.playerID === 1) {

			var alivePlayers = R.filter(R.propEq('alive', true))(activePlayers);

			changeViewTargetTo(R.lastIndexOf(cycle, alivePlayers));

			pressZ.style.visibility = "hidden";
		} else {
			pressX.style.visibility = "hidden";
		}

		return cycle;
	}());
};






var turnLeft = function(cycle) {
	return function() {
		cycle.rotateY(halfPi);
		cycle.turned = true;
		cycle.windingOrder += 1;
	};
};
var turnRight = function(cycle) {
	return function () {
		cycle.rotateY(-halfPi);
		cycle.turned = true;
		cycle.windingOrder -= 1;
	};
};

var executeTurn = function(cycle) {
	elapsedTime = clock.getElapsedTime();
	if (cycle.turnQueue.length > 0) {
		if ((elapsedTime - cycle.lastTurnTime) > turnDelay/cycle.speed) {
			var shifted = cycle.turnQueue.shift();
			var turn = shifted();
			cycle.lastTurnTime = elapsedTime;
		}
	}
};




var collapseWalls = function(cycle) {

	return function () {

		cycle.walls.scale.y -= 0.04; // scale down walls

		cycle.walls.children.forEach( function (el) {
			el.children[0].material.map.repeat.y -= 0.04; // scale down wall texture
		});

		if (cycle.walls.scale.y <= 0) { // walls are down, set up for respawn

			scene.remove(cycle.walls);
			cycle.respawnAvailable = true;

			if (cycle.playerID === 1) {
				pressZ.style.visibility = "visible";
			} else {
				pressX.style.visibility = "visible";
			}


			activePlayers.splice( activePlayers.indexOf(cycle), 1);

			var alivePlayers = R.filter(R.propEq('alive', true))(activePlayers);

			// incase someone spawns while walls are collapsing
			if (viewTarget > alivePlayers.length-1) {
				viewTarget -= 1;
			}

			var targetedCycleIndex = R.indexOf(alivePlayers[viewTarget], alivePlayers);

			if (alivePlayers.length > 0) {

				// if we're looking at dead player
				if (cameraOrbit.target === cycle.position) {

					// look at another player
					changeViewTargetTo(viewTarget-1);

				} else {

					if (targetedCycleIndex === -1) {
						console.log("error (-1), can't find target index", alivePlayers, viewTarget);
					}

					changeViewTargetTo(targetedCycleIndex);
				}
			}

			cycle.renderList.splice( cycle.renderList.indexOf(this), 1); // done, remove this task
		}
	}
};


var crash = function(cycle) {

	showInfo = false;
	
	explosions.push(new ExplodeAnimation(cycle));

	cycle.targetSpeed = 0;
	cycle.speed = 0;
	cycle.alive = false;

	updateLabel(cycle);

	var txt = document.getElementById(cycle.name);
	txt.parentNode.removeChild(txt);


	scene.remove(cycle);

	if (cycle.riseSound) cycle.riseSound.stop();

	cycle.engineSound.stop();
	cycle.explosionSound = playSound(bufferLoader.bufferList[8], 1.2, 1, false, cycle.audio);
	cycle.explosionSound = playSound(bufferLoader.bufferList[9], 0.2, 1.2, false, cycle.audio);
	cycle.renderList.splice( cycle.renderList.indexOf(animateCycle(cycle)), 1);


	setTimeout( function () { // collapse walls

		cycle.renderList.push(collapseWalls(cycle));
		cycle.wallCollapseSound = playSound(bufferLoader.bufferList[7], 1, 1.8, false, cycle.audio);
		cycle.walls.children.forEach( function (el) {
			el.children[0].material.opacity = 0.8;
			el.children[0].material.color.r = 1.0;
			el.children[0].material.color.g = 1.0;
			el.children[0].material.color.b = 1.0;
		});
	}, 1500);
};




var wallLightUp = function(cycle, wallIndex) {

	if (cycle.lightUpColor === 'r') {
		cycle.walls.children[wallIndex].children[0].material.color.r = 1;
		// cycle.walls.children[wallIndex].children[1].material.color.r = 1;
	} else if (cycle.lightUpColor === 'g') {
		cycle.walls.children[wallIndex].children[0].material.color.g = 1;
		// cycle.walls.children[wallIndex].children[1].material.color.g = 1;
	} else {
		cycle.walls.children[wallIndex].children[0].material.color.b = 1;
		// cycle.walls.children[wallIndex].children[1].material.color.b = 1;
	}
};

var wallLightFade = function(cycle) {
	if (cycle.lightUpColor === 'r') {
		cycle.walls.children.forEach( function (el) {
			if (el.children[0].material.color.r > 0) {
				el.children[0].material.color.r -= 0.03;
				// el.children[1].material.color.r -= 0.03;
			}
		});
	} else if (cycle.lightUpColor === 'g') {
		cycle.walls.children.forEach( function (el) {
			if (el.children[0].material.color.g > 0) {
				el.children[0].material.color.g -= 0.03;
				// el.children[1].material.color.g -= 0.03;
			}
		});
	} else {
		cycle.walls.children.forEach( function (el) {
			if (el.children[0].material.color.b > 0) {
				el.children[0].material.color.b -= 0.03;
				// el.children[1].material.color.b -= 0.03;
			}
		});
	}
};

var cycleHitVisuals = function(cycle) {

	cycle.model.children[0].material.opacity = 1.0 - cycle.rubber/6; // transparentize cycle body

	cycle.model.children[3].material.opacity = cycle.rubber/5; // glow cycle wireframe
	cycle.model.children[3].material.color.r = 0.5 + cycle.rubber/10;
	cycle.model.children[3].material.color.g = 1 - (cycle.rubber*cycle.rubber*cycle.rubber)/50;
	cycle.model.children[3].material.color.b = 0.5 - cycle.rubber/10;
};



var handleBraking = function(cycle) {
	if (cycle.braking) {

		cycle.brakes = Math.min(maxBrakes, cycle.brakes += brakeUseFactor);

		if (cycle.brakes >= maxBrakes) {
			cycle.braking = false;
		}

	} else if (cycle.brakes > 0) {

		cycle.brakes = Math.max(0, cycle.brakes -= brakeRestoreFactor);

	} else {
		return;
	}
};


var handleRubber = function(cycle) {

	wallLightFade(cycle);

	if (cycle.collision) { // use rubber

		if (cycle.rubber >= maxRubber) {
			cycle.riseSound.stop();
			crash(cycle);
			return;
		}

		cycle.rubber = Math.min(maxRubber, cycle.rubber += cycle.speed*rubberUseFactor);
		cycle.riseSound.playbackRate.value = 0.5 + cycle.rubber/maxRubber;
		cycle.riseSound.gainNode.gain.value = 0.5 + cycle.rubber/maxRubber;

	} else if (cycle.rubber > 0) { // restore rubber

		cycle.rubber = Math.max(0, cycle.rubber -= rubberRestoreFactor);
		cycle.riseSound.playbackRate.value = 0.1 + cycle.rubber/maxRubber;
		cycle.riseSound.gainNode.gain.value =  cycle.rubber/maxRubber;

	} else { // rubber is fully restored
		if (cycle.riseSound) {
			cycle.riseSound.stop();
		}
		return;
	}

	cycleHitVisuals(cycle);
};



var detectCollisionsBetween = function (cycle, point_A, point_B, checkRim) {

	var length = cycle.walls.children.length;
	var intersect;
	var nearestWall;
	var collisionWalls = [];
	var w;

	// check passed in points against all activePlayers/'player' walls
	activePlayers.forEach( function (player) {

		// temporarily stack player position to check against latest wall
		var obj = new THREE.Object3D();
		obj.position.set(player.position.x, player.position.y, player.position.z)
		player.walls.children.push( obj );

		for (w = 1; w < player.walls.children.length; w += 1) {

			intersect =
				doLineSegmentsIntersect(
					point_A,
					point_B,
					player.walls.children[w-1].position,
					player.walls.children[w].position);

			if (intersect.check === true) {

				collisionWalls.push({
					dist: distanceBetween(cycle.position, intersect),
					intersect: intersect,
					wallIndex: w-1,
					player: player
				});
			}
		}

		player.walls.children.pop();
	});


	if (checkRim === true) {

		for (w = 1; w < rimCoords.length; w += 1) {

			intersect =
				doLineSegmentsIntersect(
					point_A,
					point_B,
					rimCoords[w-1],
					rimCoords[w]);

			if (intersect.check === true) {

				collisionWalls.push({
					dist: distanceBetween(cycle.position, intersect),
					intersect: intersect,
					wallIndex: undefined,
					player: 'rim'
				});
			}
		}
	}


	if (collisionWalls.length === 1) { // one wall collision

		return collisionWalls[0];

	} else if (collisionWalls.length >= 2) { // multiple walls were intersected, we have to find which one's closest to the cycle

		return collisionWalls[minDistIndex(collisionWalls)];

	} else { // no collisions

		return false;
	}
};




var handleCollision = function(cycle, wallIndex, player) {

	cycle.rubberSound = playSound(bufferLoader.bufferList[6], 0.2, Math.max(0.5, cycle.speed/regularSpeed), false, cycle.audio);

	if (cycle.riseSound) {
		cycle.riseSound.stop();
	}
	cycle.riseSound = playSound(bufferLoader.bufferList[10], 0.01, cycle.rubber/2, false, cycle.audio);

	if (wallIndex !== undefined) {
		wallLightUp(player, wallIndex);
	}
};


var handleMinDistance = function(cycle, collision) {

	var backRay;
	var currentWall;
	var rearCollision;
	var alleyWidth;
	var newScale;
	var tailToWallDist = distanceBetween(cycle.currentWall.position, collision.intersect);



	if ((tailToWallDist-0.9) > cycle.rubberMinDistance) {


		if (cycle.wallAccel === true) {

			if (cycle.wallAccelAmount < 1.05) {

				cycle.stopDistance = cycle.rubberMinDistance;
			}

		} else {

			cycle.stopDistance = cycle.rubberMinDistance;
		}


	} else {

		cycle.stopDistance *= (1 - cycle.rubberMinAdjust);

		cycle.updateMatrixWorld();
		var offset = new THREE.Vector3(-(cycle.speed + cycle.rubberMinDistance), 0, 0).applyMatrix4( cycle.matrixWorld );
		rearCollision = detectCollisionsBetween(cycle, cycle.currentWall.position, offset, true);

		// make sure we dont get shoved through a wall behind us when adjusting stopDistance
		if (rearCollision) {

			//alleyWidth = distanceBetween(collision.intersect, rearCollision.intersect);
			cycle.stopDistance = tailToWallDist * (1 - cycle.rubberMinAdjust);
		}

		if (cycle.stopDistance < 0.001) {
			cycle.stopDistance = 0.001
		}
	}

	if (showInfo && cycle.playerID === 1) {

		stopLine.position.set(cycle.stopDistance, 0, 0)
	}
};



var handleDig = function(cycle, collision) {

	var dist = distanceBetween(cycle.position, collision.intersect) - cycle.stopDistance;

	cycle.velocity = dist * digFactor;

	// maintain a reasonable resolution
	if ( cycle.stopDistance < 0.001 ) {
        cycle.velocity = 0;
        cycle.stopped = true;
        return;
	}

};



var wallCheck = function(cycle) {

	cycle.updateMatrixWorld();

	var offset = new THREE.Vector3( cycle.speed*2 + cycle.rubberMinDistance, 0, 0 ).applyMatrix4( cycle.matrixWorld ); // future position in next frame + minDist

	var collision = detectCollisionsBetween(cycle, cycle.currentWall.position, offset, true);


	if (collision) {

		cycle.collision = true;

		// handle only once per collision
		if (cycle.collisionHandled === false) {

			handleMinDistance(cycle, collision);
			handleCollision(cycle, collision.wallIndex, collision.player);
			cycle.collisionHandled = true;
		}

		if (!cycle.stopped) {

			handleDig(cycle, collision);
		}


	} else {
		cycle.stopped = false;
		cycle.collision = false;
		cycle.collisionHandled = false;
		return;
	}
};




var wallAccelCheck = function(cycle) {


	var offsetLEFT = new THREE.Vector3( 0, 0, -wallAccelRange ).applyMatrix4( cycle.matrixWorld );

	var offsetRIGHT = new THREE.Vector3( 0, 0, wallAccelRange ).applyMatrix4( cycle.matrixWorld );

	var collisionLEFT = detectCollisionsBetween(cycle, cycle.position, offsetLEFT, true);
	var collisionRIGHT = detectCollisionsBetween(cycle, cycle.position, offsetRIGHT, true);



	var dist;
	cycle.wallAccel = false;
	cycle.collisionLEFT = false;
	cycle.collisionRIGHT = false;


	if (collisionLEFT) {

		if (collisionLEFT.player !== 'rim') { // skip if rim
			cycle.wallAccel = true;
		}

		cycle.collisionLEFT = true;
		cycle.collisionLEFTdist = collisionLEFT.dist;
		cycle.collisionLEFTplayer = collisionLEFT.player;
		dist = collisionLEFT.dist;
	}

	if (collisionRIGHT) {

		if (collisionRIGHT.player !== 'rim') { // skip if rim
			cycle.wallAccel = true;
		}

		cycle.collisionRIGHT = true;
		cycle.collisionRIGHTdist = collisionRIGHT.dist;
		cycle.collisionRIGHTplayer = collisionRIGHT.player;

		if (collisionLEFT) {
			dist = R.min([collisionLEFT.dist, collisionRIGHT.dist]);
		} else {
			dist = collisionRIGHT.dist;
		}
	}

	cycle.wallAccelAmount = ( (wallAccelRange - dist) * ((wallAccelFactor-1)/100) ) + 1;
};




var activateAI = function(cycle) {
	if ((elapsedTime - cycle.lastTurnTime) > 0.1) {

		// all clear, reset from whatever mess we got into:
		if (!cycle.collisionLEFT && !cycle.collisionRIGHT) {
			//console.log('clear');
			cycle.forceTurn = 0;
			cycle.windingOrder = 0;
		}

		// try and back out of a spiral
		if (cycle.windingOrder < -3) {
			//console.log('de-spiraling L');
			cycle.turnQueue.push(turnLeft(cycle));
			cycle.turnQueue.push(turnLeft(cycle));
			cycle.windingOrder = -3; // give some headroom so we dont 180 back in while going out
			cycle.forceTurn = 1;
			return;
		} else if (cycle.windingOrder > 3) {
			//console.log('de-spiraling R');
			cycle.turnQueue.push(turnRight(cycle));
			cycle.turnQueue.push(turnRight(cycle));
			cycle.windingOrder = 3;
			cycle.forceTurn = -1;
			return;
		}

		if (cycle.collisionLEFT && cycle.collisionRIGHT) {

			// go towards bigger gap
			//console.log('bigger gap');
			if (cycle.collisionLEFTdist > cycle.collisionRIGHTdist) {

				cycle.turnQueue.push(turnLeft(cycle));
			} else {
				cycle.turnQueue.push(turnRight(cycle));
			}

		} else if (cycle.collisionLEFT) {

			//console.log('R');
			cycle.turnQueue.push(turnRight(cycle));

		} else if (cycle.collisionRIGHT) {
			//console.log('L');
			cycle.turnQueue.push(turnLeft(cycle));

		} else {
			// cheers m8
			//console.log('random');
			if (Math.random() > 0.5) {
				cycle.turnQueue.push(turnLeft(cycle));
			} else {
				cycle.turnQueue.push(turnRight(cycle));
			}
		}
	}
};


var AIWallCheck = function(cycle) {

	if (cycle.AI === true) {

		if (cycle.forceTurn === 0) {
			// how far ahead to check
			var offset = new THREE.Vector3( wallAccelRange - 2, 0, 0 ).applyMatrix4( cycle.matrixWorld );
		} else {
			// reduce lookAhead to help pass walls
			var offset = new THREE.Vector3( wallAccelRange - 8, 0, 0 ).applyMatrix4( cycle.matrixWorld );
		}

		var collision = detectCollisionsBetween(cycle, cycle.currentWall.position, offset, true);


		if (collision) {
			activateAI(cycle);
			return;
		}

		if ((elapsedTime - cycle.lastTurnTime) > cycle.rand) {
			activateAI(cycle);
			cycle.rand = constrain(0.5,4)(normal_random(1.5,2));
			return;
		}
	}
};




var changeVelocity = function(cycle) {

	if (cycle.braking) {

		cycle.targetSpeed = constrainSpeed(cycle.speed*brakeFactor);
		cycle.friction = 0.03;

	} else if (cycle.boosting) {

		cycle.targetSpeed = constrainSpeed(cycle.speed*boostFactor);
		cycle.friction = 0.05;

	} else if (cycle.wallAccel) {

		cycle.targetSpeed = Math.max(regularSpeed+0.2, (cycle.speed*cycle.wallAccelAmount));
		cycle.friction = 0.05;

	} else {

		cycle.targetSpeed = regularSpeed;

		if (cycle.speed > cycle.lastSpeed) { // accelerating

			cycle.lastSpeed = cycle.speed;
			cycle.friction = 0.05;

		} else { // coasting

			cycle.lastSpeed = cycle.speed;
			cycle.friction = 0.002;
		}
	}


	if (cycle.turned) { // we have turned or respawned

		addWall(cycle);
		cycle.turnSound = playSound(bufferLoader.bufferList[5], 0.7, 10, false, cycle.audio); //playSound(bufferLoader.bufferList[5], 0.7, 10, false, cycle.audio);
		cycle.collisionHandled = false;

		cycle.friction = 0.08;
		cycle.targetSpeed = constrainSpeed(cycle.speed*turnSpeedFactor);
		cycle.turned = false;
	}


	cycle.speed = cycle.speed + (cycle.targetSpeed - cycle.speed) * cycle.friction;
};


var moveStuff = function(cycle) {

	if (!cycle.stopped) {

		if (!cycle.collision) {
			cycle.velocity = cycle.speed;
		}

		cycle.velocity *= frameTime;

		cycle.translateX(cycle.velocity);  // move cycle forward

		cycle.currentWall.scale.x += cycle.velocity;  // grow wall
		cycle.currentWall.children[0].material.map.repeat.x = cycle.currentWall.scale.x / wallTextureProportion;

		cycle.walls.netLength += cycle.velocity;

		if (cycle.walls.netLength > maxTailLength) {

			cycle.walls.children[0].scale.x -= cycle.velocity; // shrink wrong side of last wall (works, but the wall texture slides)
			// if (cycle.walls.children[0].scale.x > maxTailLength) {
			// 	cycle.walls.children[0].scale.x = maxTailLength;
			// }
			cycle.walls.children[0].translateX(cycle.velocity); // re-connect last wall
			cycle.walls.children[0].children[0].material.map.repeat.x = -(cycle.walls.children[0].scale.x / wallTextureProportion); // counter-scale texture

			cycle.walls.netLength -= cycle.velocity;

			if (cycle.walls.children[0].scale.x <= 0 && cycle.walls.children.length > 0) {
				cycle.walls.remove(cycle.walls.children[0]);
			}
		}
	}
};






var cameraView = function(cycle) {
	var relativeCameraOffset;
	var cameraOffset;

	if (view === 0) {
	 // smart
		relativeCameraOffset = new THREE.Vector3(-5, (5/regularSpeed + cycle.speed*cycle.speed*cycle.speed), 0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing/3;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing/5;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing/3;
		camera.lookAt(cycle.position);
	}

	else if (view === 1) {
	 // chase
		relativeCameraOffset = new THREE.Vector3(-40-(5*cycle.speed), 15+(18*cycle.speed), 0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing;
		camera.lookAt(cycle.position);
	}

	else if (view === 2) {
	 // stationary

	}

	else if (view === 3) {
	 // track
	 	camera.lookAt(cycle.position);
	}

	else if (view === 4) {
	 // topdown
	 	var center = new THREE.Vector3(0,0,0);
		camera.position.set(-1, 550, 0);
		camera.lookAt(center);
	}

	else if (view === 5) {
	 // cockpit
		relativeCameraOffset = new THREE.Vector3(-2+(2.5*cycle.speed), 0, 0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * 0.5;
		camera.position.y = 2;
		camera.position.z += (cameraOffset.z - camera.position.z ) * 0.5;

	 	camera.lookAt(cameraOffset);


	 	cycle.audio.gain.setTargetAtTime(0.2, ctx.currentTime, 0.02);
		cycle.textLabel.style.visibility = 'hidden';
		cycle.model.visible = false;

		if (cycle.walls.children[cycle.walls.children.length-2]) {
			cycle.walls.children[cycle.walls.children.length-1].visible = false;
			cycle.walls.children[cycle.walls.children.length-2].visible = true;
		}
	}
};



var audioMixing = function(cycle) {
	if (cycle.engineSound !== undefined) {
		cycle.engineSound.playbackRate.value = cycle.speed / cycleEnginePitchFactor;
	}

	cycle.audio.panner.setPosition(cycle.position.x, cycle.position.y, cycle.position.z);
	ctx.listener.setPosition(camera.position.x, camera.position.y, camera.position.z);

	var m = camera.matrix;
	var mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
	m.elements[12] = m.elements[13] = m.elements[14] = 0;

	var vec = new THREE.Vector3(0,0,1);
	vec.applyProjection(m);
	vec.normalize();
	var up = new THREE.Vector3(0,-1,0);
	up.applyProjection(m);
	up.normalize();

	ctx.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);

	m.elements[12] = mx;
	m.elements[13] = my;
	m.elements[14] = mz;
};



var updateLabel = function(cycle) {
	var proj = toScreenPosition(cycle, camera);
	cycle.textLabel.style.left = (proj.x - cycle.textLabel.offsetWidth/2) + 'px';
	cycle.textLabel.style.top = (proj.y - 50) + 'px';
};


var updateGauge = function(elem, num) {
	elem.val.innerHTML = num.toFixed(2);
	elem.bar.style.width = Math.min(100, num/(elem.maxVal*0.01)) + '%';
	elem.bar.style.backgroundColor = 'rgb('+ Math.floor(num*50) +','+ (255-Math.floor(num*num*num*2)) +', 0)';
};

var updateGauges = function(cycle) {
	updateGauge(gauge.rubber, cycle.rubber);
	updateGauge(gauge.speed, cycle.speed);
	updateGauge(gauge.brakes, cycle.brakes);
};





var animate = function() {

	requestAnimationFrame(animate);

	frameTime = 1.016 - clock.getDelta();

	if (paused === false) {
		activePlayers.forEach( function (cycle) {
			if (cycle.alive) {
				executeTurn(cycle);
				handleBraking(cycle);
				changeVelocity(cycle);
				wallCheck(cycle);
				wallAccelCheck(cycle);
				AIWallCheck(cycle);
				moveStuff(cycle);
				handleRubber(cycle);
				updateLabel(cycle);
			}

			cycle.renderList.forEach( function (elem, i) {
				elem();
			});

			audioMixing(cycle);

		});

		explosions.forEach( function(p) {
			p.update();
			if (p.time <= 0.0001) {
				scene.remove(explosions.shift().object);
			}
		});


		if (activePlayers[viewTarget] && activePlayers[viewTarget].alive === true) {
			cameraView(activePlayers[viewTarget]);
			updateGauges(activePlayers[viewTarget]);
		}
	}

	

	stats.update();
	renderer.render(scene, camera);
};
