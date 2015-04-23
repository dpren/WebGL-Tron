var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var time;
var delta;

var halfPi = Math.PI/2;

//setup / intit
var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000 );
	camera.position.set(-100,100,100);


var cameraControls = new THREE.OrbitControls(camera);
	cameraControls.maxDistance = 400;


var resizeWindow = function () {
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




var rubberGauge = document.querySelector('#rubber-gauge');
var speedGauge = document.querySelector('#speed-gauge');






var RENDER_LIST = []; // push stuff into this to get it animated


var turnCoords = [];


var paused = true;
var showInfo = false;
var view = 0;

var dir = 1; // cycle direction
var lastDir = undefined;

var maxTailLength = 1000;

var cycleColor = 0x0044ff;

var easing = 0.08;
var friction = 0.005;

var lastTime = 0;
//var turnStack = [];
var turnDelay = 0.01; // seconds

var rubber = 0;
var rubberDistance = 3;
var rubberDrainFactor = 5; // lower drains faster
var rubberFillFactor = 0.03; // higher refills faster

var collision = false;
var blastRadius = 1.5;

var wallAccel = false;
var wallAccelRange = 15;
var wallAccelAmount;
var wallAccelSide;

var brakeFactor = 0.5;
var boostFactor = 1.5;
var turnSpeedFactor = 0.05; 

var regularSpeed = 1.0;
var startingSpeed = 0.75;
var targetSpeed = regularSpeed;
var playerSpeed = startingSpeed;
var lastPlayerSpeed = playerSpeed;

var constrain = function (min, max) {
	return function (n) {
    	return Math.max(min, Math.min(n, max));
	};
};
var constrainSpeed = constrain(0.7, 5);  // min/max speed













/*—–––––––––––––helper stuff—––––––––––––––*/
var yellowMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: true,
		wireframeLinewidth: 1
	});

var indicatorGeo = new THREE.TetrahedronGeometry(1, 0);

var indicator = new THREE.Mesh( indicatorGeo, yellowMaterial );
	indicator.position.set(0, 5, 0);

var animateIndicator = function () {
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
var gridSize = 240;
var gridHelper = new THREE.GridHelper(gridSize, 6);
gridHelper.setColors(0x777777,0x777777);
scene.add(gridHelper);
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = (function (colorCode, x, z) {

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
		opacity: 0.0,
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


	var ecylinder = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 5);
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

		cycle.position.set(x,2,z);
		
		cycle.alive = true;
		cycle.respawnAvailable = false;
		cycle.autoPilot = false;
		cycle.turnStack = [];

	return cycle;
});


var lightcycle = createLightcycle(cycleColor, 0, 0);
var lightcycle2 = createLightcycle(0xff4400, 0, 0);

var animateCycle = function (cycle) {
	return function() {
		cycle.children[1].rotation.y -= playerSpeed/3.2;
		cycle.children[2].rotation.y -= playerSpeed/2;
		cycle.children[4].rotation.y -= playerSpeed/3.2;
		cycle.children[5].rotation.y -= playerSpeed/2;
		cycle.children[6].rotation.x += playerSpeed/3;
	};
};
RENDER_LIST.push(animateCycle(lightcycle));


/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––wall constructor—–––––––––––*/	
var wall;
var wallParent = new THREE.Object3D();
wallParent.netLength = 0;
scene.add(wallParent);
var wallTextureProportion;
var textureType = 'images/dir_wall.png';
var textureBlending = false;

var createWall = function (colorCode) {

	var texture = THREE.ImageUtils.loadTexture( textureType );
		texture.wrapS = THREE.RepeatWrapping;
		texture.needsUpdate = true;
		wallTextureProportion = (texture.image.width / texture.image.height) * 10; // *4 is actual size
		

	var wallMaterial = new THREE.MeshLambertMaterial({
		map: texture,
		color: colorCode,
		blending: textureBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
		transparent: true,
		opacity: 1
	});

	var wallGeometry = new THREE.BoxGeometry( 1, 0.1, 4 );

		wallGeometry.faceVertexUvs[0][4] = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 0)];
		wallGeometry.faceVertexUvs[0][5] = [new THREE.Vector2(0, 1), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0)];		
		wallGeometry.applyMatrix( new THREE.Matrix4().makeRotationX(-halfPi) );
		wallGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0.5, 2, 0 ) );


	return new THREE.Mesh(wallGeometry, wallMaterial);
};
/*––––––––––––––––––––––––––––––––––––––––*/


/*––––––––––––––––lights––––––––––––––––––*/
var pointLight = new THREE.PointLight(0xcccccc);
pointLight.position.set(0, 150, 0);
scene.add(pointLight);
//var pointLight2 = new THREE.PointLight(0xffffff);
//pointLight2.position.set(-120, 80, -120);
//scene.add(pointLight2);
var ambLight = new THREE.AmbientLight(0x999999);
scene.add( ambLight );
/*––––––––––––––––––––––––––––––––––––––––*/





var spawnCycle = function (cycle) {
	lastDir = undefined;
	turnCoords = [];
	cycle.turnStack = [];
	wallParent.netLength = 0;
	collision = false;
	playerSpeed = startingSpeed;
	rubber = 0;
	rubberVisuals(cycle);

	cycle.alive = true;
	cycle.position.set(0,2,0);
	scene.add(cycle);
	
	engineSound = playSound(bufferLoader.bufferList[0], 0.5, 1, true);
	document.querySelector('#press-z').style.visibility = "hidden";
};


var turnLeft = function (cycle) {
	return function() {
		++dir;
		cycle.rotateY(halfPi);
		if(dir > 3){dir = 0;}
	};
};
var turnRight = function (cycle) {
	return function() {
		--dir;
		cycle.rotateY(-halfPi);
		if(dir < 0){dir = 3;}
	};
};




var addTurnCoords = function (d) {
	turnCoords.push({
		x: lightcycle.position.x,
		z: lightcycle.position.z,
		dir: d
	});
};


var collapseWalls = function (cycle) {
	return function() {

		wallParent.scale.y -= 0.04; // lower walls

		wallParent.children.forEach( function(e) {
			e.material.map.repeat.y -= 0.04;
		});
		
		if (wallParent.scale.y <= 0) { // walls are down, set up to respawn
			wallParent.children = [];
			wallParent.scale.y = 1;
			cycle.respawnAvailable = true;
			document.querySelector('#press-z').style.visibility = "visible";
			RENDER_LIST.splice(RENDER_LIST.indexOf(this), 1); // clear this task
		}
	}
};


var crash = function (cycle) {
	targetSpeed = 0;
	playerSpeed = 0;
	cycle.alive = false;
	scene.remove(cycle);

	engineSound.stop();
	explosionSound = playSound(bufferLoader.bufferList[1], 1, 1, false);

	setTimeout(function(){
		RENDER_LIST.push(collapseWalls(cycle));
		morphSound = playSound(bufferLoader.bufferList[3], 1, 1.8, false);
		wallParent.children.forEach( function(e) {
			e.material.color.r = 1.0;
			e.material.color.g = 1.0;
			e.material.color.b = 1.0;
		});
	}, 1500);
};


var rubberVisuals = function (cycle) {

	rubberGauge.style.width = (rubber*30) + 'px';
	rubberGauge.style.backgroundColor = 'rgb('+ Math.floor(rubber*50) +','+ (255-Math.floor(rubber*rubber*rubber*2)) +', 0)';
	
	cycle.children[0].material.opacity = 1.0 - rubber/6; // fade body
	cycle.children[3].material.opacity = rubber/5; // glow wireframe
	cycle.children[3].material.color.r = 0.5 + rubber/10;
	cycle.children[3].material.color.g = 1 - (rubber*rubber*rubber)/50;
	cycle.children[3].material.color.b = 0.5 - rubber/10;
};

var wallLightFade = function () {
	wallParent.children.forEach( function(e) {
		if (e.material.color.r > 0) {
			e.material.color.r -= 0.03; // fade
		}
	});
}

var handleRubber = function (cycle) {
	
	wallLightFade();

	if (collision) {
		
		rubber = Math.min(5, rubber += playerSpeed/rubberDrainFactor);	
	
	} else if (rubber > 0) {

		rubber = Math.max(0, rubber -= rubberFillFactor);

	} else {
		
		return;
	}

	rubberVisuals(cycle);
};



var collisionHandled = false;
var handleCollision = function (cycle, wn) {
	
	if (rubber >= 5) {
		crash(cycle);
		return;
	}

	if (collisionHandled === false) {
		
		bounceSound = playSound(bufferLoader.bufferList[2], 0.1+playerSpeed/9, Math.max(1, playerSpeed), false);
		
		if (wn !== undefined) {

			wallParent.children[wn].material.color.r = 1; // light up wall
		}
		collisionHandled = true;
	}
};


// var worker = new Worker('scripts/worker.js');
// worker.onmessage = function(e) {
// 	collision = e.data.collision;
// 	if (collision === true) {
// 		handleCollision(lightcycle, e.data.wn);
// 	}
// }
// var wallCheckWorker = function (cycle) {	
// 	var cycleTrajectory = cycle.clone().translateX( rubberDistance );
// 	worker.postMessage({
// 	  cycle: cycleTrajectory.position,
// 	  turns: turnCoords,
// 	  grid: gridSize
// 	});
// };



var wallCheck = function (cycle) {
	
	var cycleTrajectory = cycle.clone().translateX( rubberDistance );
	collision = false; // remains false unless collision is detected

	var intersect;
	// bug: if player turns (creating new wall) right after speeding through a wall, the (now previous) intersection goes undetected.
	var length = turnCoords.length;
	var wn;
	for (wn = 2; wn < length; wn += 1) {
		intersect = doLineSegmentsIntersect(
									turnCoords[length-1],
									cycleTrajectory.position,
									turnCoords[wn-2],
									turnCoords[wn-1]
									);
		if (intersect === true) {
			collision = true;
			handleCollision(cycle, wn-2);
		}
	}
	if (Math.abs(cycleTrajectory.position.x) >= gridSize || Math.abs(cycleTrajectory.position.z) >= gridSize) {
		handleCollision(cycle);
		collision = true;
	}

	return collision;
};




var wallAccelCheck = function (cycle) {

	var cycleLeft = cycle.clone().translateZ( -wallAccelRange );
	var cycleRight = cycle.clone().translateZ( wallAccelRange );
	var accelIntersect;
	var length = turnCoords.length;
	wallAccel = false;

	for (var w = 2; w < length; w += 1) {

		accelIntersect = doAccelLineSegmentsIntersect(
									cycleLeft.position,
									cycleRight.position,
									turnCoords[w-2],
									turnCoords[w-1]
									);
		
		if (accelIntersect.check === true) {

			wallAccelAmount = ((wallAccelRange - accelIntersect.pointDist)/120)+1;
			//wallAccelSide = accelIntersect.whichSide; // not working yet
			wallAccel = true;
		}
	}

	return wallAccel;
};


var activateAI = function (cycle) {
	if ((time - lastTime) > 0.1) {

		// if (wallAccel) {
		// 	console.log(wallAccelSide);
		// 	if (wallAccelSide < 0) {
				
		// 		turnStack.push(turnLeft(cycle));

		// 	} else if (wallAccelSide > 0) {
				
		// 		turnStack.push(turnRight(cycle));
		// 	}
		// } else
		if (Math.random() > 0.5) {
			cycle.turnStack.push(turnLeft(cycle));

		} else {
			cycle.turnStack.push(turnRight(cycle));
		}
	}
};

var autopilotWallCheck = function (cycle) {
	return function() {
		if (cycle.alive) {
			var cycleTrajectory = cycle.clone().translateX( 10 ); // how far ahead to check
			var length = turnCoords.length;
			for (var w = 2; w < length; w += 1) {
				
				if ( doLineSegmentsIntersect(
											turnCoords[length-1],
											cycleTrajectory.position,
											turnCoords[w-2],
											turnCoords[w-1]
											) === true ) {
					activateAI(cycle);
					return;
				}
			}
			if (Math.abs(cycleTrajectory.position.x) >= gridSize || Math.abs(cycleTrajectory.position.z) >= gridSize) {
				activateAI(cycle);
				return;
			}
		}
	};
};


var onKeyDown = function (e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	
					lightcycle.turnStack.push(turnLeft(lightcycle));
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	
					lightcycle.turnStack.push(turnRight(lightcycle));
					break;

		case 80: // p
					paused = !paused;
					if (paused === false) {
						document.querySelector('#pause-msg').style.visibility="hidden";
						if (view !== 4) {
							cycleSounds.gain.value = 8;
						} else {
							cycleSounds.gain.value = 1;
						}
					} else {
						document.querySelector('#pause-msg').style.visibility="visible";
						cycleSounds.gain.value = 0;
					}
					lightcycle.turnStack = []; // clear in case turn keys are pressed while paused
					break;
		case 73: // i
					showInfo = !showInfo;
					if (showInfo) {
						stats.domElement.style.visibility="visible";
						scene.add(lookAheadLine);
						scene.add(lookAheadLine2);
						lightcycle.add(accelBoundingLine);
					} else {
						stats.domElement.style.visibility="hidden";
						scene.remove(lookAheadLine);
						scene.remove(lookAheadLine2);
						lightcycle.remove(accelBoundingLine);
					}
					break;
		case 86: // v
					view += 1;
					if (view > 4) {
						if (wallParent.children[wallParent.children.length-1]) {
							wallParent.children[wallParent.children.length-1].visible = true;
						}
						lightcycle.visible = true;
						if (paused === false) setTimeout(function(){cycleSounds.gain.value = 8;}, 150);
						view = 0;
					} else if (view === 4) {
						if (paused === false) cycleSounds.gain.value = 1;
					}
					break;
		case 87: // w
					if (THREEx.FullScreen.activated() === false) {
						THREEx.FullScreen.request();
					} else {
						THREEx.FullScreen.cancel();
					}
					break;
		case 90: // z
					if (lightcycle.respawnAvailable === true) {
						lightcycle.turnStack = []; // clear in case turn keys are pressed while dead
						spawnCycle(lightcycle);
						lightcycle.respawnAvailable = false;
					}
					break;
		case 192: // ~`
					lightcycle.autoPilot = !lightcycle.autoPilot;
					if (lightcycle.autoPilot) {
						lightcycle.add(indicator);
						RENDER_LIST.push(animateIndicator);
						RENDER_LIST.push(autopilotWallCheck(lightcycle));
					} else {
						lightcycle.remove(indicator);
						RENDER_LIST.splice(RENDER_LIST.indexOf(animateIndicator), 1);
						RENDER_LIST.splice(RENDER_LIST.indexOf(autopilotWallCheck(lightcycle)), 1);
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
    }
};

document.addEventListener('keydown', onKeyDown, true);



var cameraView = function (cycle) {
	var relativeCameraOffset;
	var cameraOffset;

	if (view === 0) {
	 // smart
		relativeCameraOffset = new THREE.Vector3(0,8+(10*playerSpeed*playerSpeed),0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing/10;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing/5;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing/10;
		camera.lookAt(cycle.position);
	}

	else if (view === 1) {
	 // chase
		relativeCameraOffset = new THREE.Vector3(-40-(5*playerSpeed),15+(20*playerSpeed),0);
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
		relativeCameraOffset = new THREE.Vector3(-2+(2.5*playerSpeed),0,0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * 0.5;
		camera.position.y = 2;
		camera.position.z += (cameraOffset.z - camera.position.z ) * 0.5;

	 	camera.lookAt(cameraOffset);

		cycle.visible = false;
		if (wallParent.children[wallParent.children.length-2]) {
			wallParent.children[wallParent.children.length-1].visible = false;
			wallParent.children[wallParent.children.length-2].visible = true;
		}
	}
};


var audioMixing = function (cycle) {

	engineSound.playbackRate.value = playerSpeed/1.3;
	
	cycleSounds.panner.setPosition(cycle.position.x, cycle.position.y, cycle.position.z);
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



var changeVelocity = function (cycle) {

	if (keyboard.pressed('space')) {

		targetSpeed = constrainSpeed(playerSpeed*brakeFactor);
		friction = 0.03;

	} else if (keyboard.pressed('b')) {

		targetSpeed = constrainSpeed(playerSpeed*boostFactor);
		friction = 0.05;

	} else if (wallAccel === true) {

		targetSpeed = Math.max(regularSpeed+0.2, playerSpeed*wallAccelAmount);
		friction = 0.05;

	} else {

		targetSpeed = regularSpeed;		

		if (playerSpeed > lastPlayerSpeed) { // accelerating

			lastPlayerSpeed = playerSpeed;
			friction = 0.05;

		} else { // coasting

			lastPlayerSpeed = playerSpeed;
			friction = 0.002;
		}
	}


	if (dir !== lastDir) { // we have turned or respawned

	    wall = createWall(cycleColor);
		wall.quaternion.copy(cycle.quaternion);
		wall.position.x = cycle.position.x;
		wall.position.z = cycle.position.z;
		wall.scale.x = 0.0001;
		wallParent.add(wall);
		addTurnCoords(dir);

		if (lastDir !== undefined) { // after spawn
			
			turnSound = playSound(bufferLoader.bufferList[1], 0.7, 10, false);
			collisionHandled = false;

			targetSpeed = constrainSpeed(playerSpeed*turnSpeedFactor);
			friction = 0.08;
		}

		lastDir = dir;
	}

	playerSpeed = playerSpeed + (targetSpeed - playerSpeed) * friction;

	speedGauge.style.width = (playerSpeed*30) + 'px';
	speedGauge.style.backgroundColor = 'rgb('+ Math.floor(playerSpeed*50) +','+ (255-Math.floor(playerSpeed*playerSpeed*playerSpeed*2)) +', 0)';
};


var moveStuff = function (cycle) {
	
	cycle.translateX(playerSpeed);  // move cycle forward

	wall.scale.x += playerSpeed;  // grow current wall
	wall.material.map.repeat.x = wall.scale.x / wallTextureProportion;
	

	wallParent.netLength += playerSpeed;

	if (wallParent.netLength > maxTailLength) {

		wallParent.children[0].scale.x -= playerSpeed; // shrink wrong side of last wall
		wallParent.children[0].translateX(playerSpeed); // re-connect last wall
		wallParent.children[0].material.map.repeat.x = -(wallParent.children[0].scale.x / wallTextureProportion);
		
		wallParent.netLength -= playerSpeed;


		if (turnCoords[0].dir === 0) {
			turnCoords[0].z += playerSpeed;
		}
		else if (turnCoords[0].dir === 1) {
			turnCoords[0].x += playerSpeed;
		}
		else if (turnCoords[0].dir === 2) {
			turnCoords[0].z -= playerSpeed;
		}
		else if (turnCoords[0].dir === 3) {
			turnCoords[0].x -= playerSpeed;
		}


		if (wallParent.children[0].scale.x <= 0 && wallParent.children.length > 0) {
			wallParent.remove(wallParent.children[0]);
			turnCoords.splice(0,1);
		}
	}
};




var executeTurn = function (cycle) {
	
	if (cycle.turnStack.length > 0) {
		if ((time - lastTime) > turnDelay/playerSpeed) {
			var shifted = cycle.turnStack.shift();
			shifted();
			lastTime = time;
		}
	}

};



var animate = function () {

	requestAnimationFrame(animate);
	time = clock.getElapsedTime();
 	//delta = clock.getDelta();
	
	if (paused === false) {

		if (lightcycle.alive) {
			executeTurn(lightcycle);
			changeVelocity(lightcycle);
			wallCheck(lightcycle);
			wallAccelCheck(lightcycle);
			if (collision === false) {
				moveStuff(lightcycle);
			}
			handleRubber(lightcycle);
		}
		
		for (var r = 0; r < RENDER_LIST.length; r += 1) {
			RENDER_LIST[r]();
		}
	
		audioMixing(lightcycle);
		cameraView(lightcycle);
		//cameraControls.target.set(lightcycle.position.x, lightcycle.position.y, lightcycle.position.z);
	}

	
	stats.update();
	renderer.render(scene, camera);
};






var startGame = function (e) {
	if (e.keyCode === 80) {
		document.querySelector('#welcome-msg').style.visibility = "hidden";
		document.removeEventListener('keydown', startGame);
		spawnCycle(lightcycle);
		audioMixing(lightcycle);
		cameraControls.target = lightcycle.position;
	}
};
document.addEventListener('keydown', startGame);

scene.add(lightcycle);


animate();