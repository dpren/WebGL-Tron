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










/*—––––––––––––line grid—––––––––––––*/
var gridSize = 300;
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
		scene.add(bwheel);

	var fcylinder = new THREE.CylinderGeometry(0.7, 0.7, .5, 16);
	var fwheel = new THREE.Mesh( fcylinder, material );
		fwheel.position.set(2,-1.3,0);
		fwheel.rotateX(halfPi);
		scene.add(fwheel);

	// ye olde light-tractor xD
	var cycle = new THREE.Object3D();
		cycle.add(cube);
		cycle.add(bwheel);
		cycle.add(fwheel);
		cycle.position.set(x,2,z);
		
		cycle.alive = true;
		cycle.respawnAvailable = false;

	return cycle;
};

var lightcycle = createLightcycle(0x00ffbb,0,0);
/*–––––––––––––––––––––––––––––––––––––––––*/


/*—–––––––––––wall constructor—–––––––––––*/	
var wall;
var wallParent = new THREE.Object3D();
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
var view = 0;

var dir = 1; // cycle direction
var lastDir;


var easing = 0.08;
var friction = 0.005;

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
var constrainSpeed = constrain(0.5, 5);  // min/max speed

var turnDelay = 0.2;
var blastRadius = 1.5;




var spawnCycle = function() {
	lastDir = null; // for turn detection
	turnCoords = [];
	lightcycle.alive = true;
	lightcycle.position.set(0,2,0);
	playerSpeed = startingSpeed;
	scene.add(lightcycle);


	engineSound = playSound(bufferLoader.bufferList[0], 0.6, 1, true);
	//engineSound2 = playSound(bufferLoader.bufferList[2], 0.3, 1, true);
	//engineOsc = oscillator('triangle', 0.07, 100);

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


var addTurnCoords = function () {
	turnCoords.push({
		x: lightcycle.position.x,
		z: lightcycle.position.z
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
	wall.scale.x -= blastRadius;

	explosionSound = playSound(bufferLoader.bufferList[1], 1.0, 1, false);
	engineSound.stop();
	//engineSound2.stop();
	//engineOsc.osc.stop();

	setTimeout(function(){RENDER_LIST.push(collapseWalls)}, 1000);
};


var collisionDetection = function() {

	if (lightcycle.position.x >= gridSize || lightcycle.position.x <= -gridSize || lightcycle.position.z >= gridSize || lightcycle.position.z <= -gridSize) {
		
		crash();

	} else {

		// cycleAhead = {
		// 	x: lightcycle.position.x,
		// 	z: lightcycle.position.z
		// };

		for (var w = 2; w < turnCoords.length; w += 1) {

			
			if (
				doLineSegmentsIntersect(
										turnCoords[turnCoords.length-1],
										lightcycle.position,
										turnCoords[w-2],
										turnCoords[w-1]
										)
				=== true ){

				crash()

			}


		}
	}
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
					} else {
						document.querySelector('#pause-msg').style.visibility="visible";
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
	} else {

		targetSpeed = regularSpeed;		

		if (playerSpeed > lastPlayerSpeed) { // accelerating

			lastPlayerSpeed = playerSpeed;
			friction = 0.05;

		} else { // coasting

			lastPlayerSpeed = playerSpeed;
			friction = 0.005;
		}
	}


	if (dir !== lastDir) { // we have turned or respawned
		
	    wall = createWall(0x00ffdd);
		wall.quaternion.copy(lightcycle.quaternion);
		wall.position.x = lightcycle.position.x;
		wall.position.z = lightcycle.position.z;
		wall.scale.x = 0;
		wallParent.add(wall);
		addTurnCoords();

		if (lastDir !== null) { // skip respawn
			turnSound = playSound(bufferLoader.bufferList[1], 0.7, 10, false);
			//awesomeSaucesomeTurnSound();

			targetSpeed = constrainSpeed(playerSpeed*turnSpeedFactor);
			friction = 0.08;
		}

		lastDir = dir;
	}


	playerSpeed = playerSpeed + (targetSpeed - playerSpeed) * friction;

	lightcycle.translateX( playerSpeed );  // move lightcycle
	wall.scale.x += playerSpeed;  // move wall
	
	return;
};

var audioMixing = function() {

	engineSound.playbackRate.value = playerSpeed;
	//engineSound2.playbackRate.value = playerSpeed * 1.8;
	//engineOsc.osc.frequency.value = playerSpeed * 110;

	cycleSounds.panner.setPosition(lightcycle.position.x, lightcycle.position.y, lightcycle.position.z);
	ctx.listener.setPosition(camera.position.x, camera.position.y, camera.position.z);

	var m = camera.matrix;
	var mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
	m.elements[12] = m.elements[13] = m.elements[14] = 0;

	// Multiply the orientation vector by the world matrix of the camera.
	var vec = new THREE.Vector3(0,0,1);
	vec.applyProjection(m);
	vec.normalize();
	// Multiply the up vector by the world matrix.
	var up = new THREE.Vector3(0,-1,0);
	up.applyProjection(m);
	up.normalize();

	// Set the orientation and the up-vector for the listener.
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
			collisionDetection();
			moveStuff();
			audioMixing();
		}
		
		for (var r = 0; r < RENDER_LIST.length; r += 1) {
			RENDER_LIST[r]();
		}
		

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