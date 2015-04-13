var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var halfPi = Math.PI/2;


//setup
//var init = function () {
	var renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000 );
		camera.position.set(-100,100,100);


	var cameraControls = new THREE.OrbitControls(camera);
		cameraControls.maxDistance = 400;


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
		document.body.appendChild( stats.domElement );






var wallAccelRange = 15;



/*—––––––––––––line grid—––––––––––––*/
var gridSize = 240;
var gridHelper = new THREE.GridHelper(gridSize, 6);
gridHelper.setColors(0x8888d8,0x888888);
scene.add(gridHelper);
/*–––––––––––––––––––––––––––––––––––*/


/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = function(colorCode, x, z) {

	var material = new THREE.MeshLambertMaterial({
		color: colorCode,
		transparent: true,
		opacity: 0.8
	});

	var cube = new THREE.Mesh(new THREE.BoxGeometry(4,4,2), material);

	var bcylinder = new THREE.CylinderGeometry(2, 2, 3, 16);
	var bwheel = new THREE.Mesh( bcylinder, material );
		bwheel.position.set(-1.5,0,0);
		bwheel.rotateX(halfPi);

	var fcylinder = new THREE.CylinderGeometry(0.7, 0.7, .5, 16);
	var fwheel = new THREE.Mesh( fcylinder, material );
		fwheel.position.set(2,-1.3,0);
		fwheel.rotateX(halfPi);

	// var yellowMaterial = new THREE.MeshLambertMaterial({
	// 	color: 0xffff00,
	// 	transparent: true,
	// 	opacity: 0.8
	// });
	// var indg = new THREE.BoxGeometry(0.5, 0.5, 0.8);
	// var indicator = new THREE.Mesh( indg, yellowMaterial );
	// 	indicator.position.set(0,5,0);
	// 	indicator.rotateX(halfPi);

	var lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff00ff
    });
	var bounds = new THREE.Geometry();
		bounds.vertices.push(new THREE.Vector3(0, 0, -wallAccelRange));
    	bounds.vertices.push(new THREE.Vector3(0, 0, wallAccelRange));
    var boundsLine = new THREE.Line(bounds, lineMaterial);

	// ye olde light-tractor
	var cycle = new THREE.Object3D();
		cycle.add(cube);
		cycle.add(bwheel);
		cycle.add(fwheel);
		cycle.add(boundsLine);
		cycle.position.set(x,2,z);
		
		cycle.alive = true;
		cycle.respawnAvailable = false;
		cycle.autoPilot = false;

	return cycle;
};

var lightcycle = createLightcycle(0x00ffbb,0,0);
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––wall constructor—–––––––––––*/	
var wall;
var wallParent = new THREE.Object3D();
wallParent.netLength = 0;
scene.add(wallParent);

var createWall = function(colorCode) {

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







var RENDER_LIST = []; // push crap into this to get it animated


var turnCoords = [];


var paused = true;
var showStats = true
var view = 3;

var dir = 1; // cycle direction
var lastDir;

var maxTailLength = 600;

var easing = 0.08;
var friction = 0.005;

var wallAccel = false;
var wallAccelAmount = 0;

var brakeFactor = 0.5;
var boostFactor = 1.5;
var turnSpeedFactor = 0.01;

var regularSpeed = 1.0;
var startingSpeed = 0.75;
var targetSpeed = regularSpeed;
var playerSpeed = startingSpeed;
var lastPlayerSpeed = playerSpeed;

var constrain = function(min, max) {
	return function(n) {
    	return Math.max(min, Math.min(n, max));
	};
}
var constrainSpeed = constrain(0.7, 5);  // min/max speed

var turnDelay = 0.2;
var blastRadius = 1.5;




var spawnCycle = function() {
	lastDir = null; // for turn detection
	turnCoords = [];
	wallParent.netLength = 0;
	lightcycle.alive = true;
	lightcycle.position.set(0,2,0);
	playerSpeed = startingSpeed;
	scene.add(lightcycle);

	engineSound = playSound(bufferLoader.bufferList[0], 0.6, 1, true);

	document.querySelector('#press-z').style.visibility = "hidden";
};

var turnCycle = {
	left: function() {
		++dir;
		lightcycle.rotateY(halfPi);
		if(dir > 3){dir = 0;}
	},
	right: function() {
		--dir;
		lightcycle.rotateY(-halfPi);
		if(dir < 0){dir = 3;}
	},
};

var executeTurn = function(callback) { // for stuff like turn delay, idk
	callback(); 
};

var addTurnCoords = function (d) {
	turnCoords.push({
		x: lightcycle.position.x,
		z: lightcycle.position.z,
		dir: d
	});
	//console.log(lightcycle.position.x, lightcycle.position.z);
	//console.log(turnCoords.length-1);
};


var collapseWalls = function(){
	if (lightcycle.alive === false){
		wallParent.scale.y -= 0.05; // lower walls
	}
	
	if (wallParent.scale.y <= 0) { // walls are down, set up to respawn
		wallParent.children = [];
		wallParent.scale.y = 1;
		lightcycle.respawnAvailable = true;
		document.querySelector('#press-z').style.visibility = "visible";
		RENDER_LIST.splice(RENDER_LIST.indexOf(this), 1); // clear this task
	}
};

var crash = function() {
	targetSpeed = 0;
	playerSpeed = 0;
	lightcycle.alive = false;
	scene.remove(lightcycle);
	//wall.scale.x -= blastRadius;

	explosionSound = playSound(bufferLoader.bufferList[1], 1.0, 1, false);
	engineSound.stop();

	setTimeout(function(){RENDER_LIST.push(collapseWalls)}, 1000);
};


var ghettoAI = function() {
	if (Math.random() > 0.5) { 
		turnCycle.left();
	} else {
		turnCycle.right();
	}
};

var collisionDetection = function() {
	
	if (lightcycle.position.x >= gridSize || lightcycle.position.x <= -gridSize ||
		lightcycle.position.z >= gridSize || lightcycle.position.z <= -gridSize) {
		crash();
		return;
	} else {


		for (var w = 2; w < turnCoords.length; w += 1) {

			if (doLineSegmentsIntersect(
										turnCoords[turnCoords.length-1],
										lightcycle.position,
										turnCoords[w-2],
										turnCoords[w-1]
										)
				=== true ) {

				crash();
				return;
			}
		}	
		

		var cycleLeft = lightcycle.clone().translateZ( -wallAccelRange );
		var cycleRight = lightcycle.clone().translateZ( wallAccelRange );

		for (var w = 2; w < turnCoords.length; w += 1) {

			var accelIntersect = doAccelLineSegmentsIntersect(
										cycleLeft.position,
										cycleRight.position,
										turnCoords[w-2],
										turnCoords[w-1]
										);
			if ( accelIntersect.check === true ) {

				wallAccelAmount = ((wallAccelRange - accelIntersect.pointDist)/150)+1;

				wallAccel = true;
				return;
			}
		}
		wallAccelAmount = 0;
		wallAccel = false;
	}
	
	// if (lightcycle.autoPilot) {
	// 	var cycleTrajectory = lightcycle.clone().translateX( 5 );
	// 	if (cycleTrajectory.position.x >= gridSize || cycleTrajectory.position.x <= -gridSize ||
	//  		cycleTrajectory.position.z >= gridSize || cycleTrajectory.position.z <= -gridSize) {
	// 		ghettoAI();
	// 		return;
	// 	} else {
	// 		for (var w = 2; w < turnCoords.length; w += 1) {
	// 			if (
	// 				doLineSegmentsIntersect(
	// 										turnCoords[turnCoords.length-1],
	// 										cycleTrajectory.position,
	// 										turnCoords[w-2],
	// 										turnCoords[w-1]
	// 										)
	// 				=== true ){
	// 				ghettoAI();
	// 				return;
	// 			}
	// 		}
	// 	}
	// }
};


var onKeyDown = function(e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	
					executeTurn(turnCycle.left);
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	
					executeTurn(turnCycle.right);
					break;

		case 80: // p
					paused = !paused;
					if (!paused) {
						document.querySelector('#pause-msg').style.visibility="hidden";
						if (view !== 4) {
							cycleSounds.gain.value = 12;
						} else {
							cycleSounds.gain.value = 1;
						}
					} else {
						document.querySelector('#pause-msg').style.visibility="visible";
						cycleSounds.gain.value = 0;
					}
					break;
		case 73: // dir
					showStats = !showStats;
					if (showStats) {
						stats.domElement.style.visibility="visible";
					} else {
						stats.domElement.style.visibility="hidden";
					}
					break;
		case 86: // v
					view += 1;
					if (view > 4) {
						if (wallParent.children[wallParent.children.length-1]) {
							wallParent.children[wallParent.children.length-1].visible = true;
						}
						lightcycle.visible = true;
						view = 0;
					}
					if (view !== 4) {
						cycleSounds.gain.value = 12;
					} else {
						cycleSounds.gain.value = 1;
					}
					break;
		case 87: // w
					if (!THREEx.FullScreen.activated()) {
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
		case 20: // caps
						lightcycle.autoPilot = !lightcycle.autoPilot;
					break;
    }
};

document.addEventListener('keydown', this.onKeyDown, true);



var cameraView = function() {
	
	if (view === 0) {
	 // smart
		var relativeCameraOffset = new THREE.Vector3(0,8+(10*playerSpeed*playerSpeed),0);
		var cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * easing/10;
		camera.position.y += (cameraOffset.y - camera.position.y) * easing/5;
		camera.position.z += (cameraOffset.z - camera.position.z) * easing/10;
		camera.lookAt(lightcycle.position);
	}

	else if (view === 1) {
	 // chase
		var relativeCameraOffset = new THREE.Vector3(-40-(5*playerSpeed),15+(20*playerSpeed),0);
		var cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
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
		var relativeCameraOffset = new THREE.Vector3(-2+(2.5*playerSpeed),0,0);
		var cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.x += (cameraOffset.x - camera.position.x) * 0.5;
		camera.position.y = 2;
		camera.position.z += (cameraOffset.z - camera.position.z ) * 0.5;

	 	//camera.lookAt(lightcycle.position);
	 	camera.lookAt(cameraOffset);

		lightcycle.visible = false;
		if (wallParent.children[wallParent.children.length-2]) {
			wallParent.children[wallParent.children.length-1].visible = false;
			wallParent.children[wallParent.children.length-2].visible = true;
		}
	}
};


var moveStuff = function() {


	if (keyboard.pressed('space')) {

		targetSpeed = constrainSpeed(playerSpeed*brakeFactor);
		friction = 0.05;

	} else if (keyboard.pressed('b')) {

		targetSpeed = constrainSpeed(playerSpeed*boostFactor);
		friction = 0.05;

	} else if (wallAccel) {

		targetSpeed = Math.max(regularSpeed+0.2, playerSpeed*wallAccelAmount);

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
		wall.scale.x = 0;
		wallParent.add(wall);
		addTurnCoords(dir);

		if (lastDir !== null) { // skip respawn
			
			turnSound = playSound(bufferLoader.bufferList[1], 0.7, 10, false);

			targetSpeed = constrainSpeed(playerSpeed*turnSpeedFactor);
			friction = 0.08;
		}

		lastDir = dir;
	}


	playerSpeed = playerSpeed + (targetSpeed - playerSpeed) * friction;

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
			turnCoords.splice(0,1)
		}
	}
	
	return;
};



var audioMixing = function() {

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




var animate = function() {

	requestAnimationFrame(animate);
	//var delta = clock.getDelta();
	
	if (!paused) {

		if (lightcycle.alive) {
			moveStuff();
			collisionDetection();
		}
		
		for (var r = 0; r < RENDER_LIST.length; r += 1) {
			RENDER_LIST[r]();
		}
		
	
		audioMixing();
	} 
	
	cameraView();

	

	stats.update();
	renderer.render(scene, camera);
};






var startGame = function(e) {
	if (e.keyCode === 80) {
		document.querySelector('#welcome-msg').style.visibility = "hidden";
		document.removeEventListener('keydown', startGame);
		spawnCycle();
	}
}
document.addEventListener('keydown', startGame);

scene.add(lightcycle);


animate();