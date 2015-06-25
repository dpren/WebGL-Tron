"use strict";

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

var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff, linewidth:2});

var bounds = new THREE.Geometry();
	bounds.vertices.push(new THREE.Vector3(0, -1.9, -wallAccelRange));
	bounds.vertices.push(new THREE.Vector3(0, -1.9, wallAccelRange));
var accelBoundingLine = new THREE.Line(bounds, new THREE.LineBasicMaterial({color: 0xffff00, linewidth:1}));

var rayV = new THREE.Geometry();
	rayV.vertices.push(new THREE.Vector3(0, -1.9, 0));
	rayV.vertices.push(new THREE.Vector3(1, -1.9, 0));
	rayV.verticesNeedUpdate = true;
var distLine = new THREE.Line(rayV, lineMaterial);

var stopV = new THREE.Geometry();
	stopV.vertices.push(new THREE.Vector3(0, -1.9, -3));
	stopV.vertices.push(new THREE.Vector3(0, -1.9, 3));
	stopV.verticesNeedUpdate = true;
var stopLine = new THREE.Line(stopV, new THREE.LineBasicMaterial({color: 0xffffff, linewidth:2}));

var stopDistV = new THREE.Geometry();
	stopDistV.vertices.push(new THREE.Vector3(0, -1.9, -0.5));
	stopDistV.vertices.push(new THREE.Vector3(0, -1.9, 0.5));
	stopDistV.verticesNeedUpdate = true;
var distLine2 = new THREE.Line(stopDistV, lineMaterial);

var animateInfoMetrics = function(cycle) {
	return function () {
		distLine.position.x = -cycle.currentWall.scale.x;
		distLine.scale.x = cycle.currentWall.scale.x + (cycle.speed*2 + cycle.rubberMinDistance);
		stopLine.position.set(cycle.stopDistance, 0, 0);
		distLine2.position.set((cycle.speed*2 + cycle.rubberMinDistance), 0, 0);
	};
};
/*––––––––––––––––––––––––––––––––––––––––*/



/*–––––––––––––––––lights––––––––––––––––––*/
var pointLight = new THREE.PointLight(0xcccccc);
pointLight.position.set(0, 150, 0);
scene.add(pointLight);

var ambLight = new THREE.AmbientLight(0x999999);
scene.add( ambLight );
/*–––––––––––––––––––––––––––––––––––––––––*/




/*—–––––––––––––––line grid—–––––––––––––––*/
// var floorTexture = new THREE.ImageUtils.loadTexture( 'images/grid09.png' );
// floorTexture.wrapS = THREE.RepeatWrapping;
// floorTexture.wrapT = THREE.RepeatWrapping;
// floorTexture.repeat.set(arenaSize/(gridTileSize), arenaSize/(gridTileSize));

// var maxAnisotropy = renderer.getMaxAnisotropy();
// floorTexture.anisotropy = maxAnisotropy;

// var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture/*, transparent: true, side: THREE.DoubleSide */});
// var floorGeometry = new THREE.PlaneBufferGeometry(arenaSize*2, arenaSize*2, 1, 1);

// var floor = new THREE.Mesh(floorGeometry, floorMaterial);
// floor.geometry.dynamic = true;

// floor.rotateX(-halfPi);
// scene.add(floor);


var gridHelper = new THREE.GridHelper(arenaSize, 6);
gridHelper.setColors(0x555555,0x555555);
scene.add(gridHelper);


var rimCoords = [{
		x: arenaSize,
		z: arenaSize
	}, {
		x: -arenaSize,
		z: arenaSize
	}, {
		x: -arenaSize,
		z: -arenaSize
	}, {
		x: arenaSize,
		z: -arenaSize
	}, {
		x: arenaSize,
		z: arenaSize
	}];
/*–––––––––––––––––––––––––––––––––––––––––*/




/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = function (x, z, dir, colorCode, engineType, ai, playerID, name) {


	var cycleMaterial = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture('images/cautionsolid.png'),
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

	var windshieldMaterial = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});

	var windshieldgeom = new THREE.PlaneBufferGeometry(2.01, 0.9);
	var windshield = new THREE.Mesh( windshieldgeom, windshieldMaterial );
		windshield.position.set(2.01, 1.1, 0);
		windshield.rotateY(halfPi);

	var windshieldSideGeom = new THREE.PlaneBufferGeometry(1.45, 0.9);
	var windshield2 = new THREE.Mesh( windshieldSideGeom, windshieldMaterial );
		windshield2.position.set(1.285, 1.1, 1.01);
	var windshield3 = new THREE.Mesh( windshieldSideGeom, windshieldMaterial );
		windshield3.position.set(1.285, 1.1, -1.01);




	var duckMaterial = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture('models/duck.jpg')
		// ,color: colorCode
	});
	var loader = new THREE.JSONLoader();



	var cycle = new THREE.Object3D();
		cycle.model = new THREE.Object3D();
		cycle.model.add(cube);
		cycle.model.add(bwheel);
		cycle.model.add(fwheel);
		cycle.model.add(cubeWire);
		cycle.model.add(bwheelWire);
		cycle.model.add(fwheelWire);
		cycle.model.add(eng);
		cycle.model.add(windshield);
		cycle.model.add(windshield2);
		cycle.model.add(windshield3);
		cycle.add(cycle.model);

		cycle.duck;

		loader.load( "models/duck.js", function( geometry ) {
		    cycle.duck = new THREE.Mesh( geometry, duckMaterial);
		    cycle.duck.scale.set( 0.05, 0.05, 0.05 );
		    cycle.duck.position.y = -2.5;
		    cycle.duck.position.x = -2;
		    cycle.duck.rotation.x = Math.PI/2;
		    cycle.add(cycle.duck);
		    cycle.duck.visible = false;
		});


		cycle.position.set(x, 2, z);

		cycle.color = colorCode;
		cycle.lightUpColor = darkestRGB(colorCode);

		cycle.rotation.set(0,-1.5707963267948966,0);
		cycle.dir = dir;
		cycle.rotateY(halfPi * dir);
		
		cycle.walls = new THREE.Object3D();
		cycle.walls.children = [];
		cycle.walls.scale.y = 1;
		cycle.walls.netLength = 0;
		cycle.currentWall;
		scene.add(cycle.walls);

		cycle.turned = false;
		cycle.turnStack = [];
		cycle.lastTurnTime = clock.getElapsedTime();
		cycle.windingOrder = 0;
		cycle.forceTurn = 0;

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
		cycle.wallAccelAmount;
		cycle.collisionLEFT;
		cycle.collisionRIGHT;
		cycle.collisionLEFTplayer;
		cycle.collisionRIGHTplayer;
		cycle.collisionLEFTdist;
		cycle.collisionRIGHTdist;

		cycle.collision = false;
		cycle.stopped = false;
		cycle.collisionHandled = false;


		cycle.alive = true;
		cycle.respawnAvailable = true;
		cycle.AI = ai;

		cycle.playerID = playerID;

		cycle.name = name;
		cycle.textLabel;

		cycle.renderList = []; // lets you add/remove stuff to the animation loop dynamically

		cycle.engineType = engineType;

		cycle.audio = ctx.createGain();
		cycle.audio.gain.value = 0.01;


		cycle.audio.panner = ctx.createPanner();
		cycle.audio.panner.panningModel = panningModel;

		cycle.audio.connect(cycle.audio.panner);
		cycle.audio.panner.connect(ctx.destination);


	return cycle;
};
/*–––––––––––––––––––––––––––––––––––––––––*/




/*—––––––––––––wall–constructor—–––––––––––*/	
var wallTextureProportion;
var textureSource = 'images/white.png';
var textureBlending = true;

var createWall = function(colorCode) {

	var group = new THREE.Group();

	var texture = THREE.ImageUtils.loadTexture( textureSource );
		texture.wrapS = THREE.RepeatWrapping;
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

	var wall = new THREE.Mesh(wallGeometry, wallMaterial);

	// makes wall visible from straight on
 	var lineGeometry = new THREE.Geometry();
	 	lineGeometry.vertices.push(
			new THREE.Vector3( 0, 4, 0 ),
			new THREE.Vector3( 1, 4, 0 )
		);
	
	var line = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial({ color: colorCode, linewidth: 1 }), THREE.LinePieces );

	group.add(wall); // === .children[0]
	group.add(line); // === .children[1]

	return group;
};
/*–––––––––––––––––––––––––––––––––––––––––*/