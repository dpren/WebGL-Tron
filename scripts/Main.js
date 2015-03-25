var keyboard = new THREEx.KeyboardState();

var halfPi = Math.PI/2;

//setup
//var init = function () {
	var renderer = new THREE.WebGLRenderer({ antialias: false });
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000 );
		camera.position.set(-30,30,50);
		//camera.position.set(-10,10,0);
		camera.rotation.x = -0.7;


	var cameraControls = new THREE.OrbitControls(camera);
		cameraControls.maxDistance = 400;


	var resizeWindow = function() {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.render(scene, camera);
	};
	window.addEventListener( 'resize', resizeWindow );

	var GUI = document.querySelector('#GUI');




/*—–––––––––––line grid—–––––––––––*/
var size = 60, step = 4;
var geo = new THREE.Geometry();
var lineMaterial = new THREE.LineBasicMaterial({ color: 'white' });
for (var j = -size; j <= size; j += step) {
	geo.vertices.push(new THREE.Vector3(-size, 0, j));
	geo.vertices.push(new THREE.Vector3( size, 0, j));
	geo.vertices.push(new THREE.Vector3( j, 0, -size));
	geo.vertices.push(new THREE.Vector3( j, 0,  size));
}
var grid = new THREE.Line( geo, lineMaterial, THREE.LinePieces);
	scene.add(grid);

// solid plane grid
// var groundGeometry = new THREE.PlaneBufferGeometry(120,120,30,30);
// var groundMaterial = new THREE.MeshBasicMaterial({ wireframe: false, color: 0x333333 });
// var ground = new THREE.Mesh( groundGeometry, groundMaterial );
// 	ground.rotateX(halfPi);
// 	scene.add( ground );
/*–––––––––––––––––––––––––––––––––*/




/*—–––––––––––cycle constructor—–––––––––––*/
var cycleMaterial = new THREE.MeshLambertMaterial({
	color: 0x00ffbb,
	transparent: true,
	opacity: 0.8
});

var cube = new THREE.Mesh(new THREE.BoxGeometry(4,4,2), cycleMaterial);

var bcylinder = new THREE.CylinderGeometry( 2, 2, 3, 16 );
var bwheel = new THREE.Mesh( bcylinder, cycleMaterial );
	bwheel.position.set(-1.5,0,0);
	bwheel.rotateX(halfPi);
	scene.add(bwheel);

var fcylinder = new THREE.CylinderGeometry( 0.7, 0.7, .5, 16 );
var fwheel = new THREE.Mesh( fcylinder, cycleMaterial );
	fwheel.position.set(2,-1.3,0);
	fwheel.rotateX(halfPi);
	scene.add(fwheel);

// ye olde light-tractor xD
var lightcycle = new THREE.Object3D();
	lightcycle.add(cube);
	lightcycle.add(bwheel);
	lightcycle.add(fwheel);
	lightcycle.position.set(0,2,0);
	scene.add(lightcycle);
/*–––––––––––––––––––––––––––––––––––––––––*/




/*—–––––––––––wall constructor—–––––––––––*/
var wallMaterial = new THREE.MeshBasicMaterial({
	color: new THREE.Color( 0x00ffdd ),
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
/*––––––––––––––––––––––––––––––––––––––––*/





var pointLight = new THREE.PointLight(0xFFFFFF);
var pointLight2 = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(100, 50, 50);
pointLight2.position.set(-150, 50, -50);
scene.add(pointLight);
scene.add(pointLight2);





var paused = true;
var view = true;

var i = 1;
var lastDir;
var playerspeed = 0.1;

function constrain(min, max) {
  return function(n) {
    return Math.max(min, Math.min(n, max));
  };
}
var constrainSpeed = constrain(0.4, 1);


var addTurnCoord = function () {
	console.log(lightcycle.position);
};



var onKeyDown = function(e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	++i;
					addTurnCoord();
					lightcycle.rotateY(halfPi);
					if(i > 3){i = 0;}
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	--i;
					addTurnCoord();
					lightcycle.rotateY(-halfPi);
					if(i < 0){i = 3;}
					break;
		case 80: // p
					paused = !paused;
					break;
		case 86: // v
					view = !view;
					break;
    }
};

document.addEventListener('keydown', this.onKeyDown, false);




var animate = function() {
	
	requestAnimationFrame(animate);

	
	if (!paused) {
		moveStuff();
		GUI.style.visibility="hidden"
	} else {
		GUI.style.visibility="visible";
	}

	if (keyboard.pressed("space")) {
		// brake
		playerspeed = constrainSpeed(playerspeed -= 0.05);
	} else {
		// accel
		playerspeed = constrainSpeed(playerspeed += 0.05);
	}

	// camera view
	if (view === true) {
		camera.lookAt(lightcycle.position);
	}


	renderer.render(scene, camera);
};




var moveStuff = function() {

	var dirX = [
		0,
	   -playerspeed,
		0,
		playerspeed
	];
	var dirZ = [
	   -playerspeed,
		0,
		playerspeed,
		0
	];


	if (i !== lastDir) {
		// we have turned, add new wall segment
		lastDir = i;
	    wall = new THREE.Mesh(wallGeometry, wallMaterial);
		wall.quaternion.copy(lightcycle.quaternion);
		wall.position.set(lightcycle.position.x,0,lightcycle.position.z);
		wall.scale.x = 0;
		scene.add(wall);
	}


	// move light cycle in direction i
	lightcycle.position.x -= dirX[i];
	lightcycle.position.z -= dirZ[i];


	// move wall
	wall.scale.x += playerspeed;
	
	return;
};


animate();