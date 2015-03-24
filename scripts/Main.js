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
for (var i = -size; i <= size; i += step) {
	geo.vertices.push(new THREE.Vector3(-size, 0, i));
	geo.vertices.push(new THREE.Vector3( size, 0, i));
	geo.vertices.push(new THREE.Vector3( i, 0, -size));
	geo.vertices.push(new THREE.Vector3( i, 0,  size));
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

// cycle direction incremented as array so it stays constant
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

//yuck
var runf = true;
var rund = true;
var runs = true;
var runj = true;
var runk = true;
var runl = true;
var isPaused = true;
var view;
var runyet;
var runyet2;
var newRot;

var addTurnCoord = function () {
	console.log(cube.position);
	tail.vertices.push(new THREE.Vector3(cube.position.x, 0, cube.position.z));
};




var render = function () {
	
	requestAnimationFrame(render);


	//left turn
	if (keyboard.pressed("f")) {
		if (runf === true) {
			runf = false;
			addTurnCoord();
	        ++i;
	        cube.rotateY(halfPi);
	        if(i > 3){i=0;}
		}
	} else {runf = true;}
	if (keyboard.pressed("d")) {
		if (rund === true) {
			rund = false;
			addTurnCoord();
	        ++i;
	        cube.rotateY(halfPi);
	        if(i > 3){i=0;}
		}
	} else {rund = true;}
	if (keyboard.pressed("s")) {
		if (runs === true) {
			runs = false;
			addTurnCoord();
	        ++i;
	        cube.rotateY(halfPi);
	        if(i > 3){i=0;}
		}
	} else {runs = true;}


	//right turn
	if (keyboard.pressed("j")) {
		if (runj === true) {
			runj = false;
			addTurnCoord();
	        --i;
	        cube.rotateY(-halfPi);
	        if(i < 0){i=3;}
	    }
	} else {runj = true;}
	if (keyboard.pressed("k")) {
		if (runk === true) {
			runk = false;
			addTurnCoord();
	        --i;
	        cube.rotateY(-halfPi);
	        if(i < 0){i=3;}
	    }
	} else {runk = true;}
	if (keyboard.pressed("l")) {
		if (runl === true) {
			runl = false;
			addTurnCoord();
	        --i;
	        cube.rotateY(-halfPi);
	        if(i < 0){i=3;}
	    }
	} else {runl = true;}



	//pause
	if (isPaused === true) {
		cube.position.x -= dirX[i];
		cube.position.z -= dirZ[i];
	}
	if (keyboard.pressed("p")) {
		if (runyet === false) {
			isPaused = !isPaused;
			runyet = true;
		} 
	} else {runyet = false;}

	//brake
	if (keyboard.pressed("space")) {
		cube.position.x += dirX[i]/1;
		cube.position.z += dirZ[i]/1;
	}

	//view
	if (keyboard.pressed("v")) {
		if (runyet2 === false) {
			view = !view;
			runyet2 = true;
		} 
	} else {runyet2 = false;}
	if (view === true) {
		camera.lookAt(cube.position);
	}
	


	//advance in direction i
	cube.position.x += dirX[i];
	cube.position.z += dirZ[i];

	


	renderer.render(scene, camera);
};


render();