"use strict";

var clock = new THREE.Clock();
var time;
var delta;

//setup / intit
var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000 );
	camera.position.set(-550, 250, 100);


var cameraOrbit = new THREE.OrbitControls(camera);
	cameraOrbit.maxDistance = 400;


var resizeWindow = function() {
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.render(scene, camera);
};
window.addEventListener('resize', resizeWindow );


var stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.visibility="hidden";
	document.body.appendChild( stats.domElement );


var pauseMsg = document.querySelector('#pause-msg');
var pressZ = document.querySelector('#press-z');
var pressX = document.querySelector('#press-x');
var rubberGauge = document.querySelector('#rubber-gauge');
var speedGauge = document.querySelector('#speed-gauge');
var brakeGauge = document.querySelector('#brake-gauge');






var activePlayers = [];

var paused = true;
var showInfo = false;
var view = 0;
var viewTarget = 0;

var gridSize = 400;

var easing = 0.08;

var blastRadius = 1.5;

var maxTailLength = 2000;

var turnDelay = 0.02; // seconds


var rubberMinDistance = 2.5;
var rubberMinAdjust = 0.5;
var digFactor = 0.4;

var rubberUseFactor = 0.08; // higher consumes faster
var rubberRestoreFactor = 0.03; // higher restores faster

var brakeUseFactor = 0.05;
var brakeRestoreFactor = 0.05;

var brakeFactor = 0.5;
var boostFactor = 1.5;
var turnSpeedFactor = 0.05; 

var wallAccelRange = 15;
var wallAccelFactor = 200;

var regularSpeed = 1.5;
var startingSpeed = 0.75;




var halfPi = Math.PI/2;

var constrain = function(min, max) {
	return function (n) {
    	return Math.max(min, Math.min(n, max));
	};
};
var constrainSpeed = constrain(regularSpeed*.7, 5);


// returns array index with smallest .dist property
var minDistIndex = function(array) {
	var minObj = R.minBy(function (obj) {
	  return obj.dist;
	}, array);
	
	var minIndex = R.indexOf(minObj, array);

	return minIndex;
};

var distanceBetween = function(p1, p2) {
	return Math.abs( (p2.x - p1.x) + (p2.z - p1.z) );
};



/*—–––––––––––––helper stuff—––––––––––––––*/
var yellowMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: true,
		wireframeLinewidth: 1
	});

var indicatorGeo = new THREE.TetrahedronGeometry(1, 0);

var indicator = new THREE.Mesh( indicatorGeo, yellowMaterial );
	indicator.position.set(0, 5, 0);

var animateIndicator = function() {
	indicator.rotation.y += 0.05;
	indicator.rotation.z += 0.02;
};

var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff,linewidth:2});

var bounds = new THREE.Geometry();
	bounds.vertices.push(new THREE.Vector3(0, 0, -wallAccelRange));
	bounds.vertices.push(new THREE.Vector3(0, 0, wallAccelRange));
var accelBoundingLine = new THREE.Line(bounds, lineMaterial);

var lookAhead = new THREE.Geometry();
	lookAhead.vertices.push(new THREE.Vector3(0, 0, 0));
	lookAhead.vertices.push(new THREE.Vector3(0, 5, 0));
var lookAheadLine = new THREE.Line(lookAhead, lineMaterial);

var lookAhead2 = new THREE.Geometry();
	lookAhead.vertices.push(new THREE.Vector3(0, 0, 0));
	lookAhead.vertices.push(new THREE.Vector3(0, 5, 0));
var lookAheadLine2 = new THREE.Line(lookAhead, lineMaterial);
/*––––––––––––––––––––––––––––––––––––––––*/




/*—–––––––––––––––line grid—–––––––––––––––*/
var gridHelper = new THREE.GridHelper(gridSize, 6);
gridHelper.setColors(0x555555,0x555555);
scene.add(gridHelper);

var rimCoords = [{
		x: gridSize,
		z: gridSize
	}, {
		x: -gridSize,
		z: gridSize
	}, {
		x: -gridSize,
		z: -gridSize
	}, {
		x: gridSize,
		z: -gridSize
	}, {
		x: gridSize,
		z: gridSize
	}];
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = (function (x, z, dir, colorCode, lightUpColor, ai, playerID) {

	var cycleMaterial = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture('images/cautionsolid.png'),
		color: colorCode,
		transparent: true,
		opacity: 1.0
	});
	var cycleMaterial2 = new THREE.MeshLambertMaterial({
		color: colorCode,
		transparent: true,
		opacity: 1.0
	});
	var wireMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: true,
		wireframeLinewidth: 2,
		transparent: true,
		opacity: 0.0
	});


	var cube = new THREE.Mesh(new THREE.BoxGeometry(5.5,4,2), cycleMaterial);
		cube.position.set(-0.75, 0, 0);
	var cubeWire = new THREE.Mesh(new THREE.BoxGeometry(5.5,4,2), wireMaterial);
		cubeWire.position.set(-0.75, 0, 0);

	var bcylinder = new THREE.CylinderGeometry(2, 2, 3, 16);
	var bwheel = new THREE.Mesh( bcylinder, cycleMaterial );
		bwheel.position.set(-1.5, 0, 0);
		bwheel.rotateX(halfPi);

	var bcylinderWire = new THREE.CylinderGeometry(2, 2, 3, 8, 1, true);
	var bwheelWire = new THREE.Mesh( bcylinderWire, wireMaterial );
		bwheelWire.position.set(-1.5, 0, 0);
		bwheelWire.rotateX(halfPi);

	var fcylinder = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 10);
	var fwheel = new THREE.Mesh( fcylinder, cycleMaterial );
		fwheel.position.set(2, -1.3, 0);
		fwheel.rotateX(halfPi);


	var fcylinderWire = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 8, 1, true);
	var fwheelWire = new THREE.Mesh( fcylinderWire, wireMaterial );
		fwheelWire.position.set(2, -1.3, 0);
		fwheelWire.rotateX(halfPi);


	var ecylinder = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 4);
	var eng = new THREE.Mesh( ecylinder, wireMaterial );
		eng.position.set(-0.2, -1, 0);
		eng.rotateZ(halfPi);

	var windshieldMaterial = new THREE.MeshNormalMaterial({color: 0x333333, side: THREE.DoubleSide});

	var windshieldgeom = new THREE.PlaneBufferGeometry(2.01, 0.9);
	var windshield = new THREE.Mesh( windshieldgeom, windshieldMaterial);
		windshield.position.set(2.01, 1.1, 0);
		windshield.rotateY(halfPi);

	var windshieldSideGeom = new THREE.PlaneBufferGeometry(1.45, 0.9);
	var windshield2 = new THREE.Mesh( windshieldSideGeom, windshieldMaterial);
		windshield2.position.set(1.285, 1.1, 1.01);
	var windshield3 = new THREE.Mesh( windshieldSideGeom, windshieldMaterial);
		windshield3.position.set(1.285, 1.1, -1.01);

	var cycle = new THREE.Object3D();
		cycle.add(cube);
		cycle.add(bwheel);
		cycle.add(fwheel);
		cycle.add(cubeWire);
		cycle.add(bwheelWire);
		cycle.add(fwheelWire);
		cycle.add(eng);
		cycle.add(windshield);
		cycle.add(windshield2);
		cycle.add(windshield3);

		cycle.color = colorCode;
		cycle.lightUpColor = lightUpColor;

		cycle.position.set(x, 2, z);
		
		cycle.rotation.set(0,-1.5707963267948966,0);
		cycle.dir = dir;
		cycle.rotateY(halfPi * dir);

		cycle.turned = false;
		cycle.turnStack = [];
		cycle.lastTurnTime = 0;
		cycle.windingOrder = 0;
		cycle.forceTurn = 0;
		
		cycle.walls = new THREE.Object3D();
		cycle.walls.children = [];
		cycle.walls.scale.y = 1;
		cycle.walls.netLength = 0;
		cycle.currentWall;

		cycle.walls.edges = new THREE.Object3D();
		cycle.walls.edges.children = [];

		scene.add(cycle.walls);
		scene.add(cycle.walls.edges);

		cycle.rubber = 0;
		cycle.rubberMinDistance = rubberMinDistance; // initial stopDistance
		cycle.rubberMinAdjust = rubberMinAdjust; // factor that stopDistance gets reduced by on each successive dig
		cycle.stopDistance = cycle.rubberMinDistance; // absolute max depth you can dig

		cycle.speed = startingSpeed;
		cycle.targetSpeed = regularSpeed;
		cycle.lastSpeed = cycle.speed;
		cycle.friction = 0.005;

		cycle.braking = false;
		cycle.brakes = 0;
		cycle.boosting = false;

		cycle.wallAccel = false;
		cycle.wallAccelLEFT;
		cycle.wallAccelRIGHT;
		cycle.wallAccelAmount;

		cycle.collision = false;
		cycle.stopped = false;
		cycle.collisionHandled = false;


		cycle.alive = true;
		cycle.respawnAvailable = false;
		cycle.AI = ai;

		cycle.playerID = playerID;

		cycle.renderList = []; // lets you add/remove stuff to the animation loop as needed


		cycle.audio = ctx.createGain();
		cycle.audio.gain.value = 8;

		cycle.audio.panner = ctx.createPanner();
		cycle.audio.panner.panningModel = "equalpower";

		cycle.audio.connect(cycle.audio.panner);
		cycle.audio.panner.connect(ctx.destination);


	return cycle;
});
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—––––––––––––wall–constructor—–––––––––––*/	
var wallTextureProportion;
var textureType = 'images/white.png';
var textureBlending = true;

var createWall = function(colorCode) {

	var texture = THREE.ImageUtils.loadTexture( textureType );
		texture.wrapS = THREE.RepeatWrapping;
		texture.needsUpdate = true;
	if (texture.image) {
		wallTextureProportion = (texture.image.width / texture.image.height) * 10; // *4 is actual size
	}

	var wallMaterial = new THREE.MeshBasicMaterial({
 		side: THREE.DoubleSide,
 		map: texture,
		color: colorCode,
		blending: textureBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
		transparent: true,
		opacity: 1
 	});

	var wallGeometry = new THREE.PlaneBufferGeometry( 1, 4 );
 	var m = new THREE.Matrix4();
 		m.makeRotationX(halfPi);
 		m.makeTranslation( 0.5, 2, 0 );
 		wallGeometry.applyMatrix( m );


	return new THREE.Mesh(wallGeometry, wallMaterial);
};
/*–––––––––––––––––––––––––––––––––––––––––*/


/*–––––––––––––––––lights––––––––––––––––––*/
var pointLight = new THREE.PointLight(0xcccccc);
pointLight.position.set(0, 150, 0);
scene.add(pointLight);

var ambLight = new THREE.AmbientLight(0x999999);
scene.add( ambLight );
/*–––––––––––––––––––––––––––––––––––––––––*/




var lightcycle1  = createLightcycle(0, 0, 0, 0x0044ff, 'r', false, 1);
var lightcycle2  = createLightcycle(0, 0, 0, 0xff6600, 'b', true, 2);

var animateCycle = function(cycle) {
	return function () {
		cycle.children[1].rotation.y -= cycle.speed/3.2;
		cycle.children[2].rotation.y -= cycle.speed/2;
		cycle.children[4].rotation.y -= cycle.speed/3.2;
		cycle.children[5].rotation.y -= cycle.speed/2;
		cycle.children[6].rotation.x += cycle.speed/3;
	};
};



var addWall = function(cycle) {
	cycle.currentWall = createWall(cycle.color);
	cycle.currentWall.quaternion.copy(cycle.quaternion);
	cycle.currentWall.position.x = cycle.position.x;
	cycle.currentWall.position.z = cycle.position.z;
	cycle.currentWall.scale.x = 0.0001;
	cycle.walls.add(cycle.currentWall);

	var wallEdges = new THREE.EdgesHelper( cycle.currentWall, cycle.color );
 	cycle.walls.edges.add(wallEdges);
};


var initCycle = function(cycle, x, z, dir, ai) {

	cycle = createLightcycle(x, z, dir, cycle.color, cycle.lightUpColor, ai, cycle.playerID);


	scene.add(cycle);
	
	cycleHitVisuals(cycle);
	updateGauge(rubberGauge, cycle.rubber);
	updateGauge(brakeGauge, cycle.rubber);

	activePlayers.push(cycle);

	cycle.renderList.push(animateCycle(cycle));


	if (cycle.playerID === 1) {
		pressZ.style.visibility = "hidden";
	} else {
		pressX.style.visibility = "hidden";
	}
	
	return cycle;
};





var turnLeft = function(cycle) {
	return function() {
		cycle.rotateY(halfPi);
		cycle.turned = true;
		cycle.windingOrder += 1;
		
		//socket.emit('turn_left', lightcycle1.playerID);
	};
};
var turnRight = function(cycle) {
	return function () {
		cycle.rotateY(-halfPi);
		cycle.turned = true;
		cycle.windingOrder -= 1;
		
		//socket.emit('turn_right', lightcycle1.playerID);
	};
};

var executeTurn = function(cycle) {
	time = clock.getElapsedTime();
	if (cycle.turnStack.length > 0) {
		if ((time - cycle.lastTurnTime) > turnDelay/cycle.speed) {
			var shifted = cycle.turnStack.shift();
			var turn = shifted();
			cycle.lastTurnTime = time;
		}
	}
};




var collapseWalls = function(cycle) {
	
	return function () {

		cycle.walls.scale.y -= 0.04; // scale down walls

		cycle.walls.children.forEach( function (el) {
			el.material.map.repeat.y -= 0.04; // scale down wall texture
		});
		

		if (cycle.walls.scale.y <= 0) { // walls are down, set up for respawn

			scene.remove(cycle.walls);
			scene.remove(cycle.walls.edges);
			cycle.respawnAvailable = true;

			if (cycle.playerID === 1) {
				pressZ.style.visibility = "visible";
			} else {
				pressX.style.visibility = "visible";
			}

			activePlayers.splice( activePlayers.indexOf(cycle), 1);
			if (activePlayers.length > 0) {
				changeViewTarget(-1); // look at another alive player
			}

			cycle.renderList.splice( cycle.renderList.indexOf(this), 1); // done, remove this task
		}
	}
};


var crash = function(cycle) {

	// if (playerID === 1) {
	// 	socket.emit('crash', cycle.playerID);
	// }

	cycle.targetSpeed = 0;
	cycle.speed = 0;
	cycle.alive = false;
	
	scene.remove(cycle);

	cycle.engineSound.stop();
	cycle.explosionSound = playSound(bufferLoader.bufferList[1], 1, 1, false, cycle.audio);
	cycle.renderList.splice( cycle.renderList.indexOf(animateCycle(cycle)), 1);


	setTimeout( function () { // collapse walls

		cycle.renderList.push(collapseWalls(cycle));
		cycle.wallCollapseSound = playSound(bufferLoader.bufferList[3], 1, 1.8, false, cycle.audio);
		cycle.walls.children.forEach( function (el) {
			el.material.opacity = 0.8;
			el.material.color.r = 1.0;
			el.material.color.g = 1.0;
			el.material.color.b = 1.0;
		});
	}, 1500);
};


var updateGauge = function(elem, val) {
	elem.style.width = (val*30) + 'px';
	elem.style.backgroundColor = 'rgb('+ Math.floor(val*50) +','+ (255-Math.floor(val*val*val*2)) +', 0)';
};


var wallLightUp = function(cycle, wallIndex) {
	
	if (cycle.lightUpColor === 'r') {
		cycle.walls.children[wallIndex].material.color.r = 1;
	} else if (cycle.lightUpColor === 'g') {
		cycle.walls.children[wallIndex].material.color.g = 1;
	} else {
		cycle.walls.children[wallIndex].material.color.b = 1;
	}
};

var wallLightFade = function(cycle) {
	if (cycle.lightUpColor === 'r') {
		cycle.walls.children.forEach( function (el) {
			if (el.material.color.r > 0) {
				el.material.color.r -= 0.03;
			}
		});
	} else if (cycle.lightUpColor === 'g') {
		cycle.walls.children.forEach( function (el) {
			if (el.material.color.g > 0) {
				el.material.color.g -= 0.03;
			}
		});
	} else {
		cycle.walls.children.forEach( function (el) {
			if (el.material.color.b > 0) {
				el.material.color.b -= 0.03;
			}
		});
	}	
};

var cycleHitVisuals = function(cycle) {
	
	cycle.children[0].material.opacity = 1.0 - cycle.rubber/6; // transparentize cycle body

	cycle.children[3].material.opacity = cycle.rubber/5; // glow cycle wireframe
	cycle.children[3].material.color.r = 0.5 + cycle.rubber/10;
	cycle.children[3].material.color.g = 1 - (cycle.rubber*cycle.rubber*cycle.rubber)/50;
	cycle.children[3].material.color.b = 0.5 - cycle.rubber/10;
};

var handleRubber = function(cycle) {
	
	wallLightFade(cycle);

	if (cycle.collision) { // use rubber

		if (cycle.rubber >= 5) {
			crash(cycle);
			return;
		}

		cycle.rubber = Math.min(5, cycle.rubber += cycle.speed*rubberUseFactor);
	
	} else if (cycle.rubber > 0) { // restore rubber

		cycle.rubber = Math.max(0, cycle.rubber -= rubberRestoreFactor);

	} else { // rubber is fully restored
		return;
	}

	cycleHitVisuals(cycle);

	if (cycle.playerID === 1) {
		updateGauge(rubberGauge, cycle.rubber);
	}
};



var detectCollisionsBetween = function (cycle, point_A, point_B, checkRim) {

	var length = cycle.walls.children.length;
	var intersect;
	var nearestWall;
	var collisionWalls = [];
	var w;

	activePlayers.forEach( function (player) {  // check A,B against all activePlayers/'player' walls

		// temporarily stack player position to check against latest wall
		var obj = new THREE.Object3D();
		obj.position.set(player.position.x, player.position.y, player.position.z)
		player.walls.children.push( obj );

		for (w = 1; w < player.walls.children.length; w += 1) {

			intersect = 
				doLineSegmentsIntersect(
					point_A.position,
					point_B.position,
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
					point_A.position,
					point_B.position,
					rimCoords[w-1],
					rimCoords[w]);

			if (intersect.check === true) {

				collisionWalls.push({
					dist: distanceBetween(cycle.position, intersect),
					intersect: intersect,
					wallIndex: undefined,
					player: undefined
				});
			}
		}
	}
	
	
	if (collisionWalls.length === 1) { // 1 wall collision

		return collisionWalls[0];

	} else if (collisionWalls.length >= 2) { // multiple walls were intersected, we have to find which one's closest to the cycle
		
		return collisionWalls[minDistIndex(collisionWalls)];

	} else { // no collisions

		return false;
	}
}




var handleCollision = function(cycle, wallIndex, player) {	
	
	cycle.rubberSound = playSound(bufferLoader.bufferList[2], 0.2, Math.max(1, cycle.speed/regularSpeed), false, cycle.audio);
	
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

		
		if (lightcycle1.wallAccel === true) {

			if (lightcycle1.wallAccelAmount < 1.05) {
				cycle.stopDistance = cycle.rubberMinDistance;
			}

		} else {

			cycle.stopDistance = cycle.rubberMinDistance;
		}


	} else {

		cycle.stopDistance *= (1 - cycle.rubberMinAdjust);

		backRay = cycle.clone().translateX( -(cycle.speed + cycle.rubberMinDistance) );
		currentWall = cycle.currentWall.position;
		rearCollision = detectCollisionsBetween(cycle, cycle.currentWall, backRay, true);

		// make sure we dont get shoved through a wall behind us when adjusting stopDistance
		if (rearCollision) {
			
			//alleyWidth = distanceBetween(collision.intersect, rearCollision.intersect);
			cycle.stopDistance = tailToWallDist * (1 - cycle.rubberMinAdjust);
		}

		if (cycle.stopDistance < 0.001) {
			cycle.stopDistance = 0.001
		}
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

	var cycleRayCast = cycle.clone().translateX( cycle.speed*2 + cycle.rubberMinDistance ); // future position in next frame

	var collision = detectCollisionsBetween(cycle, cycle.currentWall, cycleRayCast, true);


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

	var rayLEFT = cycle.clone().translateZ( -wallAccelRange );
	var rayRIGHT = cycle.clone().translateZ( wallAccelRange );

	var collisionLEFT = detectCollisionsBetween(cycle, cycle, rayLEFT, true);
	var collisionRIGHT = detectCollisionsBetween(cycle, cycle, rayRIGHT, true);

	var dist;
	cycle.wallAccel = false;
	cycle.wallAccelLEFT = false;
	cycle.wallAccelRIGHT = false;


	if (collisionLEFT) {

		if (collisionLEFT.player !== undefined) { // skip if rim
			cycle.wallAccel = true;
			cycle.wallAccelLEFT = true;
		}
		cycle.collisionLEFTdist = collisionLEFT.dist;
		dist = collisionLEFT.dist;
	}

	if (collisionRIGHT) {

		if (collisionRIGHT.player !== undefined) { // skip if rim
			cycle.wallAccel = true;
			cycle.wallAccelRIGHT = true;
		}
		cycle.collisionRIGHTdist = collisionRIGHT.dist;

		if (collisionLEFT) {
			dist = R.min([collisionLEFT.dist, collisionRIGHT.dist]);
		} else {
			dist = collisionRIGHT.dist;
		}
	}
	
	cycle.wallAccelAmount = ( (wallAccelRange - dist) / wallAccelFactor ) + 1;
};




var activateAI = function(cycle) {
	if ((time - cycle.lastTurnTime) > 0.15) {

		// all clear, reset from whatever mess we got into:
		if (!cycle.wallAccelLEFT && !cycle.wallAccelRIGHT) {
			cycle.forceTurn = 0;
			cycle.windingOrder = 0;
		}

		// try and back out of a spiral
		if (cycle.windingOrder < -6) {
			cycle.turnStack.push(turnLeft(cycle));
			cycle.turnStack.push(turnLeft(cycle));
			cycle.windingOrder = -3; // give some headroom so we dont 180 back in while going out
			cycle.forceTurn = 1;
			return;
		} else if (cycle.windingOrder > 6) {
			cycle.turnStack.push(turnRight(cycle));
			cycle.turnStack.push(turnRight(cycle));
			cycle.windingOrder = 3;
			cycle.forceTurn = -1;
			return;
		}

		if (cycle.wallAccelLEFT && cycle.wallAccelRIGHT) {

			if (cycle.forceTurn === 1) {
				cycle.turnStack.push(turnLeft(cycle));
			} else if (cycle.forceTurn === -1) {
				cycle.turnStack.push(turnRight(cycle));
			} else {

				// go towards bigger gap
				if (cycle.collisionLEFTdist > cycle.collisionRIGHTdist) {

					cycle.turnStack.push(turnLeft(cycle));
				} else {
					cycle.turnStack.push(turnRight(cycle));
				}
			}

		} else if (cycle.wallAccelLEFT) {

			cycle.turnStack.push(turnRight(cycle));

		} else if (cycle.wallAccelRIGHT) {

			cycle.turnStack.push(turnLeft(cycle));
		
		} else {
			// cheers m8
			if (Math.random() > 0.5) {
				cycle.turnStack.push(turnLeft(cycle));
			} else {
				cycle.turnStack.push(turnRight(cycle));
			}
		}
	}
};

var AIWallCheck = function(cycle) {

	if (cycle.AI === true) {

		if (cycle.forceTurn === 0) {
			var cycleRayCast = cycle.clone().translateX( wallAccelRange-2 ); // how far ahead to check
		} else {
			var cycleRayCast = cycle.clone().translateX( wallAccelRange-8 ); // reduce lookAhead to help pass walls
		}

		var collision = detectCollisionsBetween(cycle, cycle.currentWall, cycleRayCast, true);

		if (collision) {
			activateAI(cycle);
			return;
		}

		if ( (time - cycle.lastTurnTime) > 2.5 ) {
			activateAI(cycle);
			return;
		}
	}
};



var changeViewTarget = function(i) {
	
	viewTarget += i;

	if (viewTarget > activePlayers.length-1) {
		viewTarget = 0;
	} else if (viewTarget < 0) {
		viewTarget = activePlayers.length-1;
	}

	cameraOrbit.target = activePlayers[viewTarget].position;
};

var fixCockpitCam = function() {
	activePlayers.forEach( function (player) {
		if (player.walls.children.length) {
			player.walls.children[ player.walls.children.length-1 ].visible = true;
		}
		player.visible = true;
	});
};






var handleKeyDown = function(e) {

	if (event.repeat) {return;}

	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83: 	
		case 65: 	lightcycle1.turnStack.push(turnLeft(lightcycle1));
					break;

		case 74: // right
		case 75:
		case 76:
		case 186:   lightcycle1.turnStack.push(turnRight(lightcycle1));
					break;

		case 32: // space
					lightcycle1.braking = true;
					break;
		case 66: // b
					lightcycle1.boosting = true;
					break;

		case 80: // p
					paused = !paused;
					if (paused === false) {
						pauseMsg.style.visibility = "hidden";
						lightcycle1.audio.gain.value = 8;
						lightcycle2.audio.gain.value = 8;
					} else {
						pauseMsg.style.visibility = "visible";
						lightcycle1.audio.gain.value = 0;
						lightcycle2.audio.gain.value = 0;
					}
					lightcycle1.turnStack = []; // clear in case turn keys were pressed while paused
					break;
		case 67: // c
					view += 1;
					if (view > 4) {
						view = 0;
						fixCockpitCam();
						if (paused === false) {
							setTimeout( function () {
								lightcycle1.audio.gain.value = 8;
								lightcycle2.audio.gain.value = 8;
							}, 150);
						}
					}
					break;
		case 90: // z
					if (lightcycle1.respawnAvailable === true) {
						lightcycle1.turnStack = []; // clear in case turn keys were pressed while dead
						lightcycle1 = initCycle(lightcycle1, -150, 0, 1, false);
						addWall(lightcycle1);
						lightcycle1.engineSound = playSound(bufferLoader.bufferList[0], 0.5, 1, true, lightcycle1.audio);
						viewTarget = activePlayers.indexOf(lightcycle1);
						cameraOrbit.target = activePlayers[viewTarget].position; // look at your shiny new cycle
						fixCockpitCam();
					}
					break;
		case 88: // x
					if (lightcycle2.respawnAvailable === true) {
						lightcycle2.turnStack = []; // clear in case turn keys were pressed while dead
						lightcycle2 = initCycle(lightcycle2, 150, 0, 1, true);
						addWall(lightcycle2);
						lightcycle2.engineSound = playSound(bufferLoader.bufferList[4], 0.5, 1, true, lightcycle2.audio);
						fixCockpitCam();
					}
					break;
		case 73: // i
					showInfo = !showInfo;
					if (showInfo) {
						stats.domElement.style.visibility="visible";
						scene.add(lookAheadLine);
						scene.add(lookAheadLine2);
						lightcycle1.add(accelBoundingLine);
					} else {
						stats.domElement.style.visibility="hidden";
						scene.remove(lookAheadLine);
						scene.remove(lookAheadLine2);
						lightcycle1.remove(accelBoundingLine);
					}
					break;
		case 219: // [
					activePlayers.forEach( function (player) {
						player.audio.panner.panningModel = "equalpower";
					});
					break;
		case 221: // ]
					activePlayers.forEach( function (player) {
						player.audio.panner.panningModel = "HRTF";
					});
					break;
		case 188: // <
					changeViewTarget(1);
					fixCockpitCam();
					break;
		case 190: // >
					changeViewTarget(-1);
					fixCockpitCam();
					break;
		case 192: // ~`
					lightcycle1.AI = !lightcycle1.AI;
					if (lightcycle1.AI) {
						lightcycle1.add(indicator);
						lightcycle1.renderList.push(animateIndicator);
					} else {
						lightcycle1.remove(indicator);
						lightcycle1.renderList.splice(lightcycle1.renderList.indexOf(animateIndicator), 1);
					}
					break;
		case 84: // t
					textureBlending = !textureBlending;
					break;
		case 49: // 1
					textureType = 'images/dir_wall.png';
					break;
		case 50: // 2
					textureType = 'images/cautionsolid.png';
					break;
		case 51: // 3
					textureType = 'images/white.png';
					break;
		case 220: // 3
					if (lightcycle2.alive) {
						crash(lightcycle2);
					} else {
						crash(lightcycle1);
					}
					break;
		case 8:	// delete
		case 9: // tab
					e.preventDefault();
					break;

    }
};

var handleKeyUp = function(e) {
	switch ( e.keyCode ) {

		case 32: // space
					lightcycle1.braking = false;
					break;
		case 66: // b
					lightcycle1.boosting = false;
					break;
	}
};

document.addEventListener("keydown", handleKeyDown, false);
document.addEventListener("keyup", handleKeyUp, false);



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
	 // track
		camera.lookAt(cycle.position);
	}

	else if (view === 3) {
	 // stationary
	}

	else if (view === 4) {
	 // cockpit
		relativeCameraOffset = new THREE.Vector3(-2+(2.5*cycle.speed), 0, 0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * 0.5;
		camera.position.y = 2;
		camera.position.z += (cameraOffset.z - camera.position.z ) * 0.5;

	 	camera.lookAt(cameraOffset);

	 	cycle.audio.gain.value = 1.5;

		cycle.visible = false;
		if (cycle.walls.children[cycle.walls.children.length-2]) {
			cycle.walls.children[cycle.walls.children.length-1].visible = false;
			cycle.walls.children[cycle.walls.children.length-2].visible = true;
		}
	}
};


var audioMixing = function(cycle) {
	if (cycle.engineSound !== undefined) {
		cycle.engineSound.playbackRate.value = cycle.speed*0.6;
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


var handleBraking = function(cycle) {
	if (cycle.braking) {

		cycle.brakes = Math.min(5, cycle.brakes += brakeUseFactor);

		if (cycle.brakes >= 5) {
			cycle.braking = false;
		}
	
	} else if (cycle.brakes > 0) {

		cycle.brakes = Math.max(0, cycle.brakes -= brakeRestoreFactor);

	} else {
		return;
	}

	if (cycle.playerID === 1) {
		updateGauge(brakeGauge, cycle.brakes);
	}
};


var changeVelocity = function(cycle) {

	if (cycle.braking) {

		cycle.targetSpeed = constrainSpeed(cycle.speed*brakeFactor);
		cycle.friction = 0.03;

	} else if (cycle.boosting) { // b

		cycle.targetSpeed = constrainSpeed(cycle.speed*boostFactor);
		cycle.friction = 0.05;

	} else if (cycle.wallAccel === true) {

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
		cycle.turnSound = playSound(bufferLoader.bufferList[1], 0.7, 10, false, cycle.audio);
		cycle.collisionHandled = false;
		
		cycle.friction = 0.08;
		cycle.targetSpeed = constrainSpeed(cycle.speed*turnSpeedFactor);
		cycle.turned = false;
	}


	cycle.speed = cycle.speed + (cycle.targetSpeed - cycle.speed) * cycle.friction;

	if (cycle.playerID === 1) {
		updateGauge(speedGauge, cycle.speed);
	}
};


var moveStuff = function(cycle) {

	if (!cycle.stopped) {

		if (!cycle.collision) {
			cycle.velocity = cycle.speed;
		}

		cycle.translateX(cycle.velocity);  // move cycle forward


		cycle.currentWall.scale.x += cycle.velocity;  // grow wall
		cycle.currentWall.material.map.repeat.x = cycle.currentWall.scale.x / wallTextureProportion;
		
		cycle.walls.netLength += cycle.velocity;

		if (cycle.walls.netLength > maxTailLength) {

			cycle.walls.children[0].scale.x -= cycle.velocity; // shrink wrong side of last wall (works, but the wall texture slides)
			cycle.walls.children[0].translateX(cycle.velocity); // re-connect last wall
			cycle.walls.children[0].material.map.repeat.x = -(cycle.walls.children[0].scale.x / wallTextureProportion); // counter-scale texture
			
			cycle.walls.netLength -= cycle.velocity;


			if (cycle.walls.children[0].scale.x <= 0 && cycle.walls.children.length > 0) {
				cycle.walls.remove(cycle.walls.children[0]);
				cycle.walls.edges.remove(cycle.walls.edges.children[0]);
			}
		}
	}
};





var animate = function() {

	requestAnimationFrame(animate);
	
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
			}
			
			cycle.renderList.forEach( function (el, i) {
				el();
			});

			audioMixing(cycle);
		});

		// who to look at
		if (activePlayers.length > 0) {
			cameraView(activePlayers[viewTarget]);
		} else if (viewTarget === 0) {
			cameraView(lightcycle1);
		} else {
			cameraView(lightcycle2);
		}
	}


	stats.update();
	renderer.render(scene, camera);
};



var startGame = function(e) {
	if (e.keyCode === 80) {
		document.querySelector('#welcome-msg').style.visibility = "hidden";
		document.removeEventListener('keydown', startGame);
		audioMixing(lightcycle1);
		lightcycle1.engineSound = playSound(bufferLoader.bufferList[0], 0.5, 1, true, lightcycle1.audio);
		lightcycle2.engineSound = playSound(bufferLoader.bufferList[4], 0.5, 1, true, lightcycle2.audio);
		cameraOrbit.target = lightcycle1.position;
	}
};


var initGame = function() {
	lightcycle1 = initCycle(lightcycle1, -300, -5, 1, false);
	addWall(lightcycle1);
	lightcycle2 = initCycle(lightcycle2, 300, 0, 3, true);
	addWall(lightcycle2);

	camera.lookAt(lightcycle1.position);

	document.addEventListener('keydown', startGame);

	animate();
};

window.onload = function() {
	initGame();
};