var keyboard = new THREEx.KeyboardState();

var halfPi = Math.PI/2;

//setup
//var init = function () {
	var renderer = new THREE.WebGLRenderer({ antialias: false });
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000 );
		camera.position.set(50,50,60);
		camera.rotation.x = -0.7;


	var cameraControls = new THREE.OrbitControls(camera);
		cameraControls.maxDistance = 400;


	var resizeWindow = function () {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.render(scene, camera);
	};
	window.addEventListener( 'resize', resizeWindow );




//line grid
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

//plane grid
// var groundGeometry = new THREE.PlaneBufferGeometry(120,120,30,30);
// var groundMaterial = new THREE.MeshBasicMaterial({ wireframe: false, color: 0x333333 });
// var ground = new THREE.Mesh( groundGeometry, groundMaterial );
// 	ground.rotateX(halfPi);
// 	scene.add( ground );





//"cycle"
var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff99 });
var cube = new THREE.Mesh(new THREE.BoxGeometry(4,4,2), cubeMaterial);
	cube.position.set(10,2,0);
	scene.add(cube);






var tail = new THREE.Geometry();
	tail.vertices.push(new THREE.Vector3(-10,  0, -10));
	tail.vertices.push(new THREE.Vector3( 20,  0, -10));
	tail.vertices.push(new THREE.Vector3( 20,  0,  0));
	tail.vertices.push(new THREE.Vector3( 10,  0,  0));
var tailMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
var jetwall = new THREE.Line( tail, tailMaterial);
	scene.add(jetwall);





var sqLength = 4;

var squareShape = new THREE.Shape();
squareShape.moveTo(0, 0);
squareShape.lineTo(0, 4);
squareShape.lineTo(8, 4);
squareShape.lineTo(8, 0);
squareShape.lineTo(0, 0);

var extrudeSettings = {
	amount: 0.1,
	bevelEnabled: false,
	bevelSegments: 2,
	steps: 2,
	bevelSize: 0.2,
	bevelThickness: 0.2
};

var geom = new THREE.ExtrudeGeometry(squareShape, extrudeSettings);
var wallMaterial = new THREE.MeshLambertMaterial({color: 0x00ffbb, transparent: true, opacity: 0.7});
var wall = new THREE.Mesh( geom, wallMaterial );
	wall.position.set(12, 0, 0);
	wall.rotation.set(0, 0, 0);
	scene.add( wall );






var pointLight = new THREE.PointLight(0xFFFFFF);
var pointLight2 = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(100, 50, 50);
pointLight2.position.set(-150, 50, -50);
scene.add(pointLight);
scene.add(pointLight2);





var playerspeed = 0.5;

// cycle direction = i
var i = 1;
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


var addTurnCoord = function () {
	console.log(cube.position);
	tail.vertices.push(new THREE.Vector3(cube.position.x, 0, cube.position.z));
};


var isPaused = true;
var view;


var onKeyDown = function(e) {
	switch ( e.keyCode ) {
		case 70: // left
		case 68:
		case 83:
		case 65: 	addTurnCoord();
					++i;
					cube.rotateY(halfPi);
					if(i > 3){i = 0;}
					break;
		case 74: // right
		case 75:
		case 76:
		case 186: 	addTurnCoord();
					--i;
					cube.rotateY(-halfPi);
					if(i < 0){i = 3;}
					break;

		case 80: // p
					isPaused = !isPaused;
					break;

		case 86: // v
					view = !view;
					break;
    }
};

document.addEventListener('keydown', this.onKeyDown, false);



var render = function () {
	
	requestAnimationFrame(render);

	//pause
	if (isPaused === true) {
		cube.position.x -= dirX[i];
		cube.position.z -= dirZ[i];
	}
	
	//brake
	if (keyboard.pressed("space")) {
		cube.position.x += dirX[i]/1;
		cube.position.z += dirZ[i]/1;
	}

	if (view === true) {
		camera.lookAt(cube.position);
	}
	

	//advance in direction i
	cube.position.x += dirX[i];
	cube.position.z += dirZ[i];


	renderer.render(scene, camera);
};


render();