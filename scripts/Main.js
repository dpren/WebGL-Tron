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
	camera.position.set(-250, 100, 50);


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


var pauseMsg = document.querySelector('#pause-msg');
var pressZ = document.querySelector('#press-z');

var rubberGauge = document.querySelector('#rubber-gauge');
var speedGauge = document.querySelector('#speed-gauge');






var activePlayers = [];

var paused = true;
var showInfo = false;
var view = 3;
var viewTarget = 0;

var easing = 0.08;
var friction = 0.005;

var maxTailLength = 1000;

var turnDelay = 0.01; // seconds

var rubberDrainFactor = 5; // lower drains faster
var rubberFillFactor = 0.03; // higher refills faster

var blastRadius = 1.5;

var wallAccelRange = 15;

var brakeFactor = 0.5;
var boostFactor = 1.5;
var turnSpeedFactor = 0.05; 

var regularSpeed = 1.0;
var startingSpeed = 0.75;

var constrain = function (min, max) {
	return function (n) {
    	return Math.max(min, Math.min(n, max));
	};
};
var constrainSpeed = constrain(0.7, 5);













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
var createLightcycle = (function (x, z, dir, colorCode, lightUpColor, ai) {

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

		cycle.color = colorCode;
		cycle.lightUpColor = lightUpColor;

		cycle.position.set(x, 2, z);
		
		cycle.rotation.set(0,-1.5707963267948966,0);
		cycle.dir = dir;
		cycle.rotateY(halfPi * dir);

		cycle.lastDir = undefined;
		cycle.lastTurnTime = 0;
		cycle.turnStack = [];
		cycle.turnCoords = [];
		
		cycle.walls = new THREE.Object3D();
		cycle.walls.children = [];
		cycle.walls.scale.y = 1;
		scene.add(cycle.walls);
		cycle.walls.netLength = 0;
		cycle.currentWall;

		cycle.rubber = 0;
		cycle.rubberMinDistance = 3;
		cycle.rubberMinAdjust = 0.5; // factor by how much deeper you can dig upon re-approaching wall
		cycle.speed = startingSpeed;
		cycle.targetSpeed = regularSpeed;
		cycle.lastSpeed = cycle.speed;

		cycle.wallAccel = false;
		cycle.wallAccelAmount;
		//cycle.wallAccelSide; // todo: something that detects which side a nearby wall is on (for AI)

		cycle.alive = true;
		cycle.respawnAvailable = false;
		cycle.autoPilot = ai;
		cycle.collision = false;
		cycle.collisionHandled = false;

		cycle.RENDER_LIST = []; // lets you add/remove stuff to the animation loop as needed

	return cycle;
});
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—––––––––––––wall–constructor—–––––––––––*/	
var wallTextureProportion;
var textureType = 'images/white.png';
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
/*–––––––––––––––––––––––––––––––––––––––––*/


/*–––––––––––––––––lights––––––––––––––––––*/
var pointLight = new THREE.PointLight(0xdddddd);
pointLight.position.set(0, 150, 0);
scene.add(pointLight);

var ambLight = new THREE.AmbientLight(0xaaaaaa);
scene.add( ambLight );
/*–––––––––––––––––––––––––––––––––––––––––*/



var lightcycle1  = createLightcycle(0, 0, 0, 0x0044ff, 'r', false);
var lightcycle2  = createLightcycle(0, 0, 0, 0xff4400, 'g', true);

var animateCycle = function (cycle) {
	return function() {
		cycle.children[1].rotation.y -= cycle.speed/3.2;
		cycle.children[2].rotation.y -= cycle.speed/2;
		cycle.children[4].rotation.y -= cycle.speed/3.2;
		cycle.children[5].rotation.y -= cycle.speed/2;
		cycle.children[6].rotation.x += cycle.speed/3;
	};
};

var spawnCycle = function (cycle, x, z, dir, ai) {

	cycle = createLightcycle(x, z, dir, cycle.color, cycle.lightUpColor, ai);
	
	addCycleTurnCoords(cycle);
	
	scene.add(cycle);
	
	rubberVisuals(cycle);

	activePlayers.push(cycle);
	
	//engineSound = playSound(bufferLoader.bufferList[0], 0.5, 1, true);
	cycle.RENDER_LIST.push(animateCycle(cycle));

	pressZ.style.visibility = "hidden";

	return cycle;
};


var turnLeft = function (cycle) {
	return function() {
		++cycle.dir;
		cycle.rotateY(halfPi);
		if(cycle.dir > 3){cycle.dir = 0;}
	};
};
var turnRight = function (cycle) {
	return function() {
		--cycle.dir;
		cycle.rotateY(-halfPi);
		if(cycle.dir < 0){cycle.dir = 3;}
	};
};

var executeTurn = function (cycle) {
	time = clock.getElapsedTime();
	if (cycle.turnStack.length > 0) {
		if ((time - cycle.lastTurnTime) > turnDelay/cycle.speed) {
			var shifted = cycle.turnStack.shift();
			shifted();
			cycle.lastTurnTime = time;
		}
	}
};


var addCycleTurnCoords = function (cycle) {
	cycle.turnCoords.push({
		x: cycle.position.x,
		z: cycle.position.z,
		wallDir: cycle.dir
	});
};


var collapseWalls = function (cycle) {
	
	return function() {

		cycle.walls.scale.y -= 0.04; // scale down walls

		cycle.walls.children.forEach( function(el) {
			el.material.map.repeat.y -= 0.04; // scale down wall texture
		});
		

		if (cycle.walls.scale.y <= 0) { // walls are down, set up for respawn

			scene.remove(cycle.walls);
			cycle.respawnAvailable = true;

			if (cycle === lightcycle1) {
				pressZ.style.visibility = "visible";
			}

			activePlayers.splice( activePlayers.indexOf(cycle), 1);
			if (activePlayers.length > 0) {
				changeViewTarget(-1); // look at another alive player
			}

			cycle.RENDER_LIST.splice( cycle.RENDER_LIST.indexOf(this), 1); // done, remove this task
		}
	}
};


var crash = function (cycle) {
	cycle.targetSpeed = 0;
	cycle.speed = 0;
	cycle.alive = false;
	
	scene.remove(cycle);

	//engineSound.stop();
	explosionSound = playSound(bufferLoader.bufferList[1], 1, 1, false);
	cycle.RENDER_LIST.splice( cycle.RENDER_LIST.indexOf(animateCycle(cycle)), 1);

	setTimeout( function() {

		cycle.RENDER_LIST.push(collapseWalls(cycle));
		morphSound = playSound(bufferLoader.bufferList[3], 1, 1.8, false);
		cycle.walls.children.forEach( function(el) {
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

var wallLightUp = function (cycle, wn) {
	
	if (cycle.lightUpColor === 'r') {
		cycle.walls.children[wn].material.color.r = 1;
	} else if (cycle.lightUpColor === 'g') {
		cycle.walls.children[wn].material.color.g = 1;
	} else {
		cycle.walls.children[wn].material.color.b = 1;
	}
};

var wallLightFade = function (cycle) {
		if (cycle.lightUpColor === 'r') {
			cycle.walls.children.forEach( function(el) {
				if (el.material.color.r > 0) {
					el.material.color.r -= 0.03;
				}
			});
		} else if (cycle.lightUpColor === 'g') {
			cycle.walls.children.forEach( function(el) {
				if (el.material.color.g > 0) {
					el.material.color.g -= 0.03;
				}
			});
		} else {
			cycle.walls.children.forEach( function(el) {
				if (el.material.color.b > 0) {
					el.material.color.b -= 0.03;
				}
			});
		}	
};

var rubberVisuals = function (cycle) {
	
	if (cycle === lightcycle1) {
		updateGauge(rubberGauge, cycle.rubber);
	}
	
	cycle.children[0].material.opacity = 1.0 - cycle.rubber/6; // fade body

	cycle.children[3].material.opacity = cycle.rubber/5; // glow wireframe
	cycle.children[3].material.color.r = 0.5 + cycle.rubber/10;
	cycle.children[3].material.color.g = 1 - (cycle.rubber*cycle.rubber*cycle.rubber)/50;
	cycle.children[3].material.color.b = 0.5 - cycle.rubber/10;
};

var handleRubber = function (cycle) {
	
	wallLightFade(cycle);

	if (cycle.collision) {
		
		cycle.rubber = Math.min(5, cycle.rubber += cycle.speed/rubberDrainFactor);	
	
	} else if (cycle.rubber > 0) {

		cycle.rubber = Math.max(0, cycle.rubber -= rubberFillFactor);

	} else {
		
		return;
	}

	rubberVisuals(cycle);
};



var handleCollision = function (cycle, wn, el) {
	
	if (cycle.rubber >= 5) {
		crash(cycle);
		return;
	}

	if (cycle.collisionHandled === false) {
		
		bounceSound = playSound(bufferLoader.bufferList[2], 0.1+cycle.speed/9, Math.max(1, cycle.speed), false);
		
		if (wn !== undefined && cycle === el) {
		//if (wn !== undefined) {
			wallLightUp(el, wn);
		}

		cycle.collisionHandled = true;
	}
};


// todo: cycle.rubberMinAdjust

var wallCheck = function (cycle) {
	// bug: if player turns (creating new wall) right after speeding through a wall, the (now previous) intersection goes undetected.
	var cycleTrajectory = cycle.clone().translateX( cycle.rubberMinDistance );
	var intersect;
	var intersectOther;
	var intersectOtherLatest;
	var length = cycle.turnCoords.length;
	cycle.collision = false; // remains false unless collision is detected


	activePlayers.forEach( function(el) {

		var w;
		if (el === cycle) { // own walls, don't check latest two

			for (w = 2; w < el.turnCoords.length; w += 1) {
				intersect = doLineSegmentsIntersect(
											cycle.turnCoords[cycle.turnCoords.length-1],
											cycleTrajectory.position,
											el.turnCoords[w-2],
											el.turnCoords[w-1]
											);
				if (intersect === true) {

					cycle.collision = true;
					handleCollision(cycle, w-2, el);
				}
			}

		} else { // other players walls

			for (w = 1; w < el.turnCoords.length; w += 1) { // all but latest
				intersectOther = doLineSegmentsIntersect(
											cycle.turnCoords[cycle.turnCoords.length-1],
											cycleTrajectory.position,
											el.turnCoords[w-1],
											el.turnCoords[w]
											);
				if (intersectOther === true) {

					cycle.collision = true;
					handleCollision(cycle, w-1, el);
				}
			}

			intersectOtherLatest = doLineSegmentsIntersect( // latest wall being formed
										cycle.turnCoords[cycle.turnCoords.length-1],
										cycleTrajectory.position,
										el.turnCoords[el.turnCoords.length-1],
										el.position
										);

			if (intersectOtherLatest === true) {
				
				cycle.collision = true;
				handleCollision(cycle, el.turnCoords[el.turnCoords.length-1], el);
			}
		}
	});

	if (Math.abs(cycleTrajectory.position.x) >= gridSize || Math.abs(cycleTrajectory.position.z) >= gridSize) {
		handleCollision(cycle);
		cycle.collision = true;
	}
};




var wallAccelCheck = function (cycle) {

	var cycleLeft = cycle.clone().translateZ( -wallAccelRange );
	var cycleRight = cycle.clone().translateZ( wallAccelRange );
	var accelIntersect;
	var length = cycle.turnCoords.length;
	cycle.wallAccel = false;

	for (var w = 2; w < length; w += 1) {

		accelIntersect = doAccelLineSegmentsIntersect(
									cycleLeft.position,
									cycleRight.position,
									cycle.turnCoords[w-2],
									cycle.turnCoords[w-1]
									);
		
		if (accelIntersect.check === true) {

			cycle.wallAccelAmount = ((wallAccelRange - accelIntersect.pointDist)/120)+1;
			//cycle.wallAccelSide = accelIntersect.whichSide; // not working yet
			cycle.wallAccel = true;
		}
	}

	return cycle.wallAccel;
};



var activateAI = function (cycle) {
	if ((time - cycle.lastTurnTime) > 0.2) {

		/*if (cycle.wallAccel) {
			console.log(cycle.wallAccelSide);
			if (cycle.wallAccelSide < 0) {
				turnStack.push(turnLeft(cycle));
			} else if (cycle.wallAccelSide > 0) {
				turnStack.push(turnRight(cycle));
			}
		} else*/

		if (Math.random() > 0.5) {
			cycle.turnStack.push(turnLeft(cycle));
		} else {
			cycle.turnStack.push(turnRight(cycle));
		}	
	}
};

var autopilotWallCheck = function (cycle) {

	if (cycle.autoPilot === true) {
		var cycleTrajectory = cycle.clone().translateX( 10 ); // how far ahead to check
		var length = cycle.turnCoords.length;
		for (var w = 2; w < length; w += 1) {
			
			if ( doLineSegmentsIntersect(
										cycle.turnCoords[cycle.turnCoords.length-1],
										cycleTrajectory.position,
										cycle.turnCoords[w-2],
										cycle.turnCoords[w-1]
										) === true ) {
				activateAI(cycle);
				return;
			}
		}
		if (Math.abs(cycleTrajectory.position.x) >= gridSize || Math.abs(cycleTrajectory.position.z) >= gridSize) {
			activateAI(cycle);
			return;
		}
		if (time - cycle.lastTurnTime > 3 ) {
			activateAI(cycle);
			return;
		}
	}
};

var changeViewTarget = function (i) {
	
	viewTarget += i;

	if (viewTarget > activePlayers.length-1) {
		viewTarget = 0;
	} else if (viewTarget < 0) {
		viewTarget = activePlayers.length-1;
	}

	cameraControls.target = activePlayers[viewTarget].position;
}


var onKeyDown = function (e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	
					lightcycle1.turnStack.push(turnLeft(lightcycle1));
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	
					lightcycle1.turnStack.push(turnRight(lightcycle1));
					break;

		case 80: // p
					paused = !paused;
					if (paused === false) {
						pauseMsg.style.visibility = "hidden";
						if (view !== 4) {
							cycleSounds.gain.value = 8;
						} else {
							cycleSounds.gain.value = 1;
						}
					} else {
						pauseMsg.style.visibility = "visible";
						cycleSounds.gain.value = 0;
					}
					lightcycle1.turnStack = []; // clear in case turn keys are pressed while paused
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
		case 67: // c
					view += 1;
					if (view > 4) {
						view = 0;
						if (activePlayers[viewTarget].walls.children[activePlayers[viewTarget].walls.children.length-1]) {
							activePlayers[viewTarget].walls.children[activePlayers[viewTarget].walls.children.length-1].visible = true;
						}
						activePlayers[viewTarget].visible = true;
						if (paused === false) setTimeout(function(){cycleSounds.gain.value = 8;}, 150);
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
					if (lightcycle1.respawnAvailable === true) {
						lightcycle1.turnStack = []; // clear in case turn keys are pressed while dead
						lightcycle1 = spawnCycle(lightcycle1, -150, 0, 1, false);
						viewTarget = activePlayers.indexOf(lightcycle1);
						cameraControls.target = activePlayers[viewTarget].position; // look at your shiny new cycle
					}
					break;
		case 88: // x
					if (lightcycle2.respawnAvailable === true) {
						lightcycle2.turnStack = []; // clear in case turn keys are pressed while dead
						lightcycle2 = spawnCycle(lightcycle2, 150, 0, 1, true);
					}
					break;
		case 192: // ~`
					lightcycle1.autoPilot = !lightcycle1.autoPilot;
					if (lightcycle1.autoPilot) {
						lightcycle1.add(indicator);
						lightcycle1.RENDER_LIST.push(animateIndicator);
					} else {
						lightcycle1.remove(indicator);
						lightcycle1.RENDER_LIST.splice(lightcycle1.RENDER_LIST.indexOf(animateIndicator), 1);
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
		case 86: // v
					changeViewTarget(1);
					break;
    }
};

document.addEventListener('keydown', onKeyDown, true);



var cameraView = function (cycle) {
	var relativeCameraOffset;
	var cameraOffset;

	if (view === 0) {
	 // smart
		relativeCameraOffset = new THREE.Vector3(-20, (10*cycle.speed*cycle.speed), 0);
		cameraOffset = relativeCameraOffset.applyMatrix4( cycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing/10;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing/5;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing/10;
		camera.lookAt(cycle.position);
	}

	else if (view === 1) {
	 // chase
		relativeCameraOffset = new THREE.Vector3(-40-(5*cycle.speed), 15+(20*cycle.speed), 0);
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

		cycle.visible = false;
		if (cycle.walls.children[cycle.walls.children.length-2]) {
			cycle.walls.children[cycle.walls.children.length-1].visible = false;
			cycle.walls.children[cycle.walls.children.length-2].visible = true;
		}
	}
};


var audioMixing = function (cycle) {

	//engineSound.playbackRate.value = cycle.speed/1.3;
	
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

		cycle.targetSpeed = constrainSpeed(cycle.speed*brakeFactor);
		friction = 0.03;

	} else if (keyboard.pressed('b')) {

		cycle.targetSpeed = constrainSpeed(cycle.speed*boostFactor);
		friction = 0.05;

	} else if (cycle.wallAccel === true) {

		cycle.targetSpeed = Math.max(regularSpeed+0.2, cycle.speed*cycle.wallAccelAmount);
		friction = 0.05;

	} else {

		cycle.targetSpeed = regularSpeed;		

		if (cycle.speed > cycle.lastSpeed) { // accelerating

			cycle.lastSpeed = cycle.speed;
			friction = 0.05;

		} else { // coasting

			cycle.lastSpeed = cycle.speed;
			friction = 0.002;
		}
	}


	if (cycle.dir !== cycle.lastDir) { // we have turned or respawned

	    cycle.currentWall = createWall(cycle.color);
		cycle.currentWall.quaternion.copy(cycle.quaternion);
		cycle.currentWall.position.x = cycle.position.x;
		cycle.currentWall.position.z = cycle.position.z;
		cycle.currentWall.scale.x = 0.0001;
		cycle.walls.add(cycle.currentWall);
		//addCycleTurnCoords(cycle);

		if (cycle.lastDir !== undefined) { // after spawn

			addCycleTurnCoords(cycle);
			
			turnSound = playSound(bufferLoader.bufferList[1], 0.7, 10, false);
			cycle.collisionHandled = false;

			cycle.targetSpeed = constrainSpeed(cycle.speed*turnSpeedFactor);
			friction = 0.08;
		}

		cycle.lastDir = cycle.dir;
	}

	cycle.speed = cycle.speed + (cycle.targetSpeed - cycle.speed) * friction;

	if (cycle === lightcycle1) {
		updateGauge(speedGauge, cycle.speed);
	}
};


var moveStuff = function (cycle) {
	if (cycle.collision === false) {

		cycle.translateX(cycle.speed);  // move cycle forward

		cycle.currentWall.scale.x += cycle.speed;  // grow wall
		cycle.currentWall.material.map.repeat.x = cycle.currentWall.scale.x / wallTextureProportion;
		
		cycle.walls.netLength += cycle.speed;

		if (cycle.walls.netLength > maxTailLength) {

			cycle.walls.children[0].scale.x -= cycle.speed; // shrink wrong side of last wall
			cycle.walls.children[0].translateX(cycle.speed); // re-connect last wall
			cycle.walls.children[0].material.map.repeat.x = -(cycle.walls.children[0].scale.x / wallTextureProportion);
			
			cycle.walls.netLength -= cycle.speed;


			if (cycle.turnCoords[0].wallDir === 0) {
				cycle.turnCoords[0].z += cycle.speed;
			}
			else if (cycle.turnCoords[0].wallDir === 1) {
				cycle.turnCoords[0].x += cycle.speed;
			}
			else if (cycle.turnCoords[0].wallDir === 2) {
				cycle.turnCoords[0].z -= cycle.speed;
			}
			else if (cycle.turnCoords[0].wallDir === 3) {
				cycle.turnCoords[0].x -= cycle.speed;
			}


			if (cycle.walls.children[0].scale.x <= 0 && cycle.walls.children.length > 0) {
				cycle.walls.remove(cycle.walls.children[0]);
				cycle.turnCoords.splice(0,1);
			}
		}
	}
};





var animate = function () {

	requestAnimationFrame(animate);
	//time = clock.getElapsedTime();
 	//delta = clock.getDelta();
	
	if (paused === false) {

		activePlayers.forEach( function (cycle) {
			if (cycle.alive) {
				executeTurn(cycle);
				changeVelocity(cycle);
				wallCheck(cycle);
				wallAccelCheck(cycle);
				autopilotWallCheck(cycle);
				moveStuff(cycle);
				handleRubber(cycle);
			}
			audioMixing(cycle);
			cameraView(activePlayers[viewTarget]);
			
			cycle.RENDER_LIST.forEach( function (el, i) {
				el();
			});
		});
	}
	
	stats.update();
	renderer.render(scene, camera);
};



var startGame = function (e) {
	if (e.keyCode === 80) {
		document.querySelector('#welcome-msg').style.visibility = "hidden";
		document.removeEventListener('keydown', startGame);
		lightcycle1 = spawnCycle(lightcycle1, -150, 0, 1, false);
		lightcycle2 = spawnCycle(lightcycle2, 150, 10, 3, true);
		audioMixing(lightcycle1);
		cameraControls.target = lightcycle1.position;
	}
};
document.addEventListener('keydown', startGame);


animate();