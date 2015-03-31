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
		camera.position.set(-30,30,30);


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
var gridSize = 60;
var gridHelper = new THREE.GridHelper(gridSize, 4);
gridHelper.setColors(0xaaaaaa,0xaaaaaa);
scene.add(gridHelper);
/*–––––––––––––––––––––––––––––––––––*/



/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = function(colorCode, x, z){

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

var i = 1;
var lastDir;

var playerspeed = 0.1;
function constrain(min, max) {
	return function(n) {
    	return Math.max(min, Math.min(n, max));
	};
}
var constrainSpeed = constrain(0.5, 1);  // min/max speed


var spawnCycle = function() {
	lightcycle.alive = true;
	lightcycle.position.set(0,2,0);
	scene.add(lightcycle);
	document.querySelector('#press-z').style.visibility = "hidden";

}


var addTurnCoord = function () {
	turnCoords.push(lightcycle.position.x, lightcycle.position.z);
		console.log(lightcycle.position.x, lightcycle.position.z);
};


var collapseWalls = function(){
	if (lightcycle.alive === false){
		wallParent.scale.y -= 0.05; // lower walls
	}
	
	if (wallParent.scale.y <= 0) { // walls are down, set up to respawn
		wallParent.children = [];
		wallParent.scale.y = 1;
		lastDir = null; // for turn detection
		coords = [];
		document.querySelector('#press-z').style.visibility = "visible";
		RENDER_LIST.splice(RENDER_LIST.indexOf(this), 1); // clear this task
	}
};


var collisionDetection = function() {

	if (lightcycle.position.x >= gridSize || lightcycle.position.x <= -gridSize || lightcycle.position.z >= gridSize || lightcycle.position.z <= -gridSize) {

		playerspeed = 0;
		lightcycle.alive = false;
		scene.remove(lightcycle);
		RENDER_LIST.push(collapseWalls);
	}
}



var onKeyDown = function(e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	
					++i;
					addTurnCoord();
					lightcycle.rotateY(halfPi);
					if(i > 3){i = 0;}
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	
					--i;
					addTurnCoord();
					lightcycle.rotateY(-halfPi);
					if(i < 0){i = 3;}
					break;

		case 80: // p
					paused = !paused;
					if (!paused) {
						document.querySelector('#pause-msg').style.visibility="hidden"
					} else {
						document.querySelector('#pause-msg').style.visibility="visible";
					}
					break;
		case 73: // i
					showStats = !showStats;
					if (showStats) {
						stats.domElement.style.visibility="visible";
					} else {
						stats.domElement.style.visibility="hidden"
					}
					break;
		case 86: // v
					view += 1;
					if(view > 3){view = 0;}
					break;

		case 90: // z - respawn
					if (lightcycle.alive === false && wallParent.scale.y === 1) {
						spawnCycle();
					}
					break;
    }
};

document.addEventListener('keydown', this.onKeyDown, true);



var cameraView = function(){
	
	if (view === 0) {		
	 // track
		camera.lookAt( lightcycle.position );
	}

	else if (view === 1) {
	 // stationary
	}

	else if (view === 2) {
	 // cockpit
		var relativeCameraOffset = new THREE.Vector3(0,0,0);
		var cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
		camera.lookAt( lightcycle.position );
	}

	else if (view === 3) {
	 // chase
		var relativeCameraOffset = new THREE.Vector3(-40,30,0);
		var cameraOffset = relativeCameraOffset.applyMatrix4( lightcycle.matrixWorld );
		camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
		camera.lookAt( lightcycle.position );
	}
};


var moveStuff = function() {

	if (i !== lastDir) {
		// we have turned or respawned, add new wall segment
		lastDir = i;
	    wall = createWall(0x00ffdd);
		wall.quaternion.copy(lightcycle.quaternion);
		wall.position.x = lightcycle.position.x;
		wall.position.z = lightcycle.position.z;
		wall.scale.x = 0;
		wallParent.add(wall);
	}

	// move lightcycle
	lightcycle.translateX( playerspeed );

	// move wall
	wall.scale.x += playerspeed;
	
	return;
};






var animate = function() {

	requestAnimationFrame(animate);
	// var delta = clock.getDelta();
	
	if (!paused) {

		if (lightcycle.alive) {
			moveStuff();
			collisionDetection();
		}
		
		for (var r = 0; r < RENDER_LIST.length; r += 1) {
			RENDER_LIST[r]();
		}
		
		if (keyboard.pressed('space')) {
			playerspeed = constrainSpeed(playerspeed -= 0.05); // brake
		} else {
			playerspeed = constrainSpeed(playerspeed += 0.05); // accel
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
	}
}
document.addEventListener('keydown', startGame);

spawnCycle();

animate();