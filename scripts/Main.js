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
var showInfo = true;
var view = 0;

var dir = 1; // cycle direction
var lastDir = undefined;

var maxTailLength = 800;

var easing = 0.08;
var friction = 0.005;

var turnDelay = 0.11; // seconds

var rubber = 0;
var rubberDistance = 3;
var rubberDrainFactor = 5; // lower drains faster
var rubberFillFactor = 0.03; // higher refills faster

var collision = false;
var collisionWall = undefined; // test
var blastRadius = 1.5;

var wallAccel = false;
var wallAccelRange = 15;
var wallAccelAmount;

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
	indicator.position.set(0,5,0);

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
gridHelper.setColors(0x8888d8,0x888888);
scene.add(gridHelper);
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = function (colorCode, x, z) {

	var cycleMaterial = new THREE.MeshLambertMaterial({
		color: colorCode,
		transparent: true,
		opacity: 0.7
	});
	var wireMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		transparent: true,
		opacity: 0.0,
		wireframe: true,
		wireframeLinewidth: 2,
	});


	var cube = new THREE.Mesh(new THREE.BoxGeometry(4,4,2), cycleMaterial);
	var cubeWire = new THREE.Mesh(new THREE.BoxGeometry(4,4,2), wireMaterial);

	var bcylinder = new THREE.CylinderGeometry(2, 2, 3, 16);
	var bwheel = new THREE.Mesh( bcylinder, cycleMaterial );
		bwheel.position.set(-1.5,0,0);
		bwheel.rotateX(halfPi);
		scene.add(bwheel);
	var bcylinderWire = new THREE.CylinderGeometry(2, 2, 3, 8, 1, true);
	var bwheelWire = new THREE.Mesh( bcylinderWire, wireMaterial );
		bwheelWire.position.set(-1.5,0,0);
		bwheelWire.rotateX(halfPi);
		scene.add(bwheelWire);

	var fcylinder = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 8);
	var fwheel = new THREE.Mesh( fcylinder, cycleMaterial );
		fwheel.position.set(2,-1.3,0);
		fwheel.rotateX(halfPi);
		scene.add(fwheel);
	var fcylinderWire = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 8, 1, true);
	var fwheelWire = new THREE.Mesh( fcylinderWire, wireMaterial );
		fwheelWire.position.set(2,-1.3,0);
		fwheelWire.rotateX(halfPi);
		scene.add(fwheelWire);


	var ecylinder = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 5);
	var eng = new THREE.Mesh( ecylinder, wireMaterial );
		eng.position.set(-0.2,-1,0);
		eng.rotateZ(halfPi);
		scene.add(eng);

	var cycle = new THREE.Object3D();
		cycle.add(cube);
		cycle.add(eng);
		cycle.add(bwheel);
		cycle.add(bwheelWire);
		cycle.add(fwheel);
		cycle.add(fwheelWire);
		cycle.add(cubeWire);
		cycle.position.set(x,2,z);
		
		cycle.alive = true;
		cycle.respawnAvailable = false;
		cycle.autoPilot = false;

	return cycle;
};

var lightcycle = createLightcycle(0x00ffbb,0,0);
var animateEng = function () {
	lightcycle.children[1].rotation.x += playerSpeed/3;
	lightcycle.children[3].rotation.y -= playerSpeed/3.2;
	lightcycle.children[5].rotation.y -= playerSpeed/2;
};
RENDER_LIST.push(animateEng);
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––wall constructor—–––––––––––*/	
var wall;
var wallParent = new THREE.Object3D();
wallParent.netLength = 0;
scene.add(wallParent);

var createWall = function (colorCode) {

	var wallMaterial = new THREE.MeshBasicMaterial({
		//map: THREE.ImageUtils.loadTexture('images/texture.png'),
		color: colorCode,
		side: THREE.DoubleSide,
		blending: THREE.AdditiveBlending,
		opacity: 0.6,
		transparent: true
	});

	var wallGeometry = new THREE.PlaneBufferGeometry( 1, 4 );
	var m = new THREE.Matrix4();
		m.makeRotationX(halfPi);
		m.makeTranslation( 0.5, 2, 0 );
		wallGeometry.applyMatrix( m );

	return new THREE.Mesh(wallGeometry, wallMaterial);
};
/*––––––––––––––––––––––––––––––––––––––––*/


/*––––––––––––––––lights––––––––––––––––––*/
var pointLight = new THREE.PointLight(0xFFFFFF);
var pointLight2 = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(100, 50, 50);
pointLight2.position.set(-150, 50, -50);
scene.add(pointLight);
scene.add(pointLight2);
/*––––––––––––––––––––––––––––––––––––––––*/










var spawnCycle = function () {
	lastDir = undefined; // for turn detection
	turnCoords = [];
	wallParent.netLength = 0;
	rubber = 0;

	collision = false;
	collisionWall = undefined;
	lightcycle.alive = true;
	lightcycle.position.set(0,2,0);
	playerSpeed = startingSpeed;
	scene.add(lightcycle);

	engineSound = playSound(bufferLoader.bufferList[0], 0.5, 1, true);

	document.querySelector('#press-z').style.visibility = "hidden";
};


var turnLeft = function () {
	++dir;
	lightcycle.rotateY(halfPi);
	if(dir > 3){dir = 0;}
};
var turnRight = function () {
	--dir;
	lightcycle.rotateY(-halfPi);
	if(dir < 0){dir = 3;}
};




var addTurnCoords = function (d) {
	turnCoords.push({
		x: lightcycle.position.x,
		z: lightcycle.position.z,
		dir: d
	});
};


var collapseWalls = function () {

	wallParent.scale.y -= 0.04; // lower walls
	
	if (wallParent.scale.y <= 0) { // walls are down, set up to respawn
		wallParent.children = [];
		wallParent.scale.y = 1;
		lightcycle.respawnAvailable = true;
		document.querySelector('#press-z').style.visibility = "visible";
		RENDER_LIST.splice(RENDER_LIST.indexOf(this), 1); // clear this task
	}
};


var crash = function () {
	targetSpeed = 0;
	playerSpeed = 0;
	lightcycle.alive = false;
	scene.remove(lightcycle);
	wall.scale.x -= blastRadius;

	explosionSound = playSound(bufferLoader.bufferList[1], 1.0, 1, false);
	engineSound.stop();

	setTimeout(function(){
		RENDER_LIST.push(collapseWalls);
		morphSound = playSound(bufferLoader.bufferList[3], 1.2, 1.7, false);
		wallParent.children.forEach( function(e, index) {
			e.material.color.r = 1.0;
			e.material.color.g = 1.0;
			e.material.color.b = 1.0;
		});
	}, 1500);
};


var handleRubber = function () {
	
	if (collision) {
		
		rubber =  Math.min(5, rubber += playerSpeed/rubberDrainFactor);	

	} else if (rubber >= 0) {

		rubber = Math.max(0, rubber -= rubberFillFactor);
		
		if (showInfo && collisionWall !== undefined) {
			if (wallParent.children[collisionWall].material.color.r > 0) {
				wallParent.children[collisionWall].material.color.r -= 0.05;
			} else {

			collisionWall = undefined; // de-illuminate collisionWall
			}
		}

	}

	rubberGauge.style.width = (rubber*30) + 'px';
	rubberGauge.style.backgroundColor = 'rgb('+ Math.floor(rubber*50) +','+ (255-Math.floor(rubber*rubber*rubber*2)) +', 0)';
	
	lightcycle.children[1].material.opacity = rubber/5;
	lightcycle.children[1].material.color.r = 0.5 + rubber/10;
	lightcycle.children[1].material.color.g = 1 - (rubber*rubber*rubber)/50;
	lightcycle.children[1].material.color.b = 0.5 - rubber/10;
};

bouncePlayed = false;
var handleCollision = function () {
	if (rubber >= 5) {
		crash();
	}
	if (bouncePlayed === false) {
		bounceSound = playSound(bufferLoader.bufferList[2], 0.1+playerSpeed/6, Math.max(1, playerSpeed), false);
		bouncePlayed = true;
	}
};

var wn;
var wallCheck = function () {
	
	var cycleTrajectory = lightcycle.clone().translateX( rubberDistance );

	var length = turnCoords.length;
	var intersect;

	collision = false; // remains false unless collision is detected

	// bug: if player turns (creating new wall) right after speeding through a wall, the previous intersection goes undetected.

	for (wn = 2; wn < length; wn += 1) {

		intersect = doLineSegmentsIntersect(
									turnCoords[length-1],
									cycleTrajectory.position,
									turnCoords[wn-2],
									turnCoords[wn-1]
									);

		if (intersect === true) {

			handleCollision();
			collision = true;
			collisionWall = wn-2;
			if (showInfo) wallParent.children[collisionWall].material.color.r = 1; // highlight this wall
			//return true;
		}
	}

	if (Math.abs(cycleTrajectory.position.x) >= gridSize || Math.abs(cycleTrajectory.position.z) >= gridSize) {
		
		handleCollision();
		collision = true;
		//return true;
	}

	return collision;
};


var wallAccelCheck = function () {
	
	var cycleLeft = lightcycle.clone().translateZ( -wallAccelRange );
	var cycleRight = lightcycle.clone().translateZ( wallAccelRange );
	
	var accelIntersect;
	var length = turnCoords.length;
	for (var w = 2; w < length; w += 1) {

		accelIntersect = doAccelLineSegmentsIntersect(
									cycleLeft.position,
									cycleRight.position,
									turnCoords[w-2],
									turnCoords[w-1]
									);
		
		if (accelIntersect.check === true) {

			wallAccelAmount = ((wallAccelRange - accelIntersect.pointDist)/120)+1;
			wallAccel = true;
			return true; // possibly skips walls
		}
	}
	wallAccelAmount = 0;
	wallAccel = false;
};


// var ghettoAI = function () {
// 	if (Math.random() > 0.5) { 
// 		turnLeft();
// 	} else {
// 		turnRight();
// 	}
// };
// var autopilotWallCheck = function () {	
// 	var cycleTrajectory = lightcycle.clone().translateX( 5 ); // how far ahead to check
// 	var length = turnCoords.length;
// 	for (var w = 2; w < length; w += 1) {
// 		if (
// 			doLineSegmentsIntersect(
// 									turnCoords[length-1],
// 									cycleTrajectory.position,
// 									turnCoords[w-2],
// 									turnCoords[w-1]
// 									)
// 			=== true ){
// 			ghettoAI();
// 			return;
// 		}
// 	}
// 	if (Math.abs(cycleTrajectory.position.x) >= gridSize || Math.abs(cycleTrajectory.position.z) >= gridSize){
// 		ghettoAI();
// 		return;
// 	}
// };


var onKeyDown = function (e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	
					turnStack.push(turnLeft);
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	
					turnStack.push(turnRight);
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
						if (collisionWall !== undefined && lightcycle.alive) {
							wallParent.children[collisionWall].material.color.r = 0; // de-illuminate collisionWall
							collisionWall = undefined;
						}
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
						spawnCycle();
						lightcycle.respawnAvailable = false;
					}
					break;
		case 192: // ~`
					lightcycle.autoPilot = !lightcycle.autoPilot;
					if (lightcycle.autoPilot) {
						lightcycle.add(indicator);
						RENDER_LIST.push(animateIndicator);
					} else {
						lightcycle.remove(indicator);
						RENDER_LIST.splice(RENDER_LIST.indexOf(animateIndicator), 1);
					}
					break;
    }
};

document.addEventListener('keydown', onKeyDown, true);



var cameraView = function () {
	var relativeCameraOffset;
	var cameraOffset;

	if (view === 0) {
	 // smart
		relativeCameraOffset = new THREE.Vector3(0,8+(10*playerSpeed*playerSpeed),0);
		cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing/10;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing/5;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing/10;
		camera.lookAt(lightcycle.position);
	}

	else if (view === 1) {
	 // chase
		relativeCameraOffset = new THREE.Vector3(-40-(5*playerSpeed),15+(20*playerSpeed),0);
		cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing;
		camera.lookAt(lightcycle.position);
	}

	else if (view === 2) {		
	 // track
		camera.lookAt(lightcycle.position);
	}

	else if (view === 3) {
	 // stationary
	}

	else if (view === 4) {
	 // cockpit
		relativeCameraOffset = new THREE.Vector3(-2+(2.5*playerSpeed),0,0);
		cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * 0.5;
		camera.position.y = 2;
		camera.position.z += (cameraOffset.z - camera.position.z ) * 0.5;

	 	camera.lookAt(cameraOffset);

		lightcycle.visible = false;
		if (wallParent.children[wallParent.children.length-2]) {
			wallParent.children[wallParent.children.length-1].visible = false;
			wallParent.children[wallParent.children.length-2].visible = true;
		}
	}
};


var changeVelocity = function () {

	if (keyboard.pressed('space')) {

		targetSpeed = constrainSpeed(playerSpeed*brakeFactor);
		friction = 0.03;

	} else if (keyboard.pressed('b')) {

		targetSpeed = constrainSpeed(playerSpeed*boostFactor);
		friction = 0.05;

	} else if (wallAccel) {

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

	    wall = createWall(0x00ffdd);
		wall.quaternion.copy(lightcycle.quaternion);
		wall.position.x = lightcycle.position.x;
		wall.position.z = lightcycle.position.z;
		wall.scale.x = 0.0001;
		wallParent.add(wall);
		addTurnCoords(dir);

		if (lastDir !== undefined) { // skip respawn
			
			turnSound = playSound(bufferLoader.bufferList[1], 0.7, 10, false);
			bouncePlayed = false;

			targetSpeed = constrainSpeed(playerSpeed*turnSpeedFactor);
			friction = 0.08;
		}

		lastDir = dir;
	}

	playerSpeed = playerSpeed + (targetSpeed - playerSpeed) * friction;

	speedGauge.style.width = (playerSpeed*30) + 'px';
	speedGauge.style.backgroundColor = 'rgb('+ Math.floor(playerSpeed*50) +','+ (255-Math.floor(playerSpeed*playerSpeed*playerSpeed*2)) +', 0)';
};


var moveStuff = function () {
	
	lightcycle.translateX( playerSpeed );  // move lightcycle

	wall.scale.x += playerSpeed;  // grow current wall
	wallParent.netLength += playerSpeed;

	if (wallParent.netLength > maxTailLength) {

		wallParent.children[0].scale.x -= playerSpeed; // shrink wrong side of last wall
		wallParent.children[0].translateX( playerSpeed ); // re-connect last wall
		
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



var audioMixing = function () {

	engineSound.playbackRate.value = playerSpeed;

	cycleSounds.panner.setPosition(lightcycle.position.x, lightcycle.position.y, lightcycle.position.z);
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



var lastTime = 0;
var turnStack = [];
var executeTurn = function (callback) {
	
	if (turnStack.length > 0) {
		if ((time - lastTime) > turnDelay) {
			var shifted = turnStack.shift();
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
			executeTurn();
			changeVelocity();
			wallCheck();
			wallAccelCheck();
			if (collision === false) {
				moveStuff();
			}
			handleRubber();
		}
		
		var RL = RENDER_LIST.length;
		for (var r = 0; r < RL; r += 1) {
			RENDER_LIST[r]();
		}
		
	
		audioMixing();
	} 
	
	cameraView();

	

	stats.update();
	renderer.render(scene, camera);
};






var startGame = function (e) {
	if (e.keyCode === 80) {
		document.querySelector('#welcome-msg').style.visibility = "hidden";
		document.removeEventListener('keydown', startGame);
		spawnCycle();
		audioMixing();
	}
};
document.addEventListener('keydown', startGame);

scene.add(lightcycle);


animate();