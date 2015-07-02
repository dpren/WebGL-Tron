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

var chatIndicator = function() {
	indicator.rotation.y += 0.05;
	indicator.rotation.z += 0.02;
};


var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff, linewidth:2});

var bounds = new THREE.Geometry();
	bounds.vertices.push(new THREE.Vector3(0, -1.9, -wallAccelRange));
	bounds.vertices.push(new THREE.Vector3(0, -1.9, wallAccelRange));
var accelBoundingLine = new THREE.Line(bounds, new THREE.LineBasicMaterial({color: 0xffff00, linewidth:1}));

var distV = new THREE.Geometry();
	distV.vertices.push(new THREE.Vector3(0, -1.9, 0));
	distV.vertices.push(new THREE.Vector3(1, -1.9, 0));
var distLine = new THREE.Line(distV, lineMaterial);

var dist2V = new THREE.Geometry();
	dist2V.vertices.push(new THREE.Vector3(0, -1.9, -0.5));
	dist2V.vertices.push(new THREE.Vector3(0, -1.9, 0.5));
var distLine2 = new THREE.Line(dist2V, lineMaterial);

var stopV = new THREE.Geometry();
	stopV.vertices.push(new THREE.Vector3(0, -1.9, -3));
	stopV.vertices.push(new THREE.Vector3(0, -1.9, 3));
var stopLine = new THREE.Line(stopV, new THREE.LineBasicMaterial({color: 0xffffff, linewidth:2}));

var animateInfoMetrics = function(cycle) {
	return function () {
		distLine.position.x = -cycle.currentWall.scale.x;
		distLine.scale.x = cycle.currentWall.scale.x + (cycle.speed + cycle.rubberMinDistance);
		distLine2.position.set((cycle.speed + cycle.rubberMinDistance), 0, 0);
		stopLine.position.set(cycle.stopDistance, 0, 0);
	};
};
/*––––––––––––––––––––––––––––––––––––––––*/



/*–––––––––––––––––lights––––––––––––––––––*/
var pointLight = new THREE.PointLight(0xcccccc);
pointLight.position.set(0, 150, 0);
scene.add(pointLight);
//scene.add(new THREE.PointLightHelper(pointLight, 3));

var ambLight = new THREE.AmbientLight(0x999999);
scene.add( ambLight );
/*–––––––––––––––––––––––––––––––––––––––––*/




/*—–––––––––––––––grid—–––––––––––––––*/
var anisotropy = 16;
var createGrid = function(q) {

	scene.remove(grid);

	if (q === true) {

		var floorTexture = new THREE.ImageUtils.loadTexture( 'images/grid09.png' );
		floorTexture.wrapS = THREE.RepeatWrapping;
		floorTexture.wrapT = THREE.RepeatWrapping;
		floorTexture.repeat.set(arenaSize/(gridTileSize), arenaSize/(gridTileSize));

		// var anisotropy = renderer.getMaxAnisotropy(); // === 16
		floorTexture.anisotropy = anisotropy;

		var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
		var floorGeometry = new THREE.PlaneBufferGeometry(arenaSize*2, arenaSize*2, 1, 1);

		grid = new THREE.Mesh(floorGeometry, floorMaterial);
		grid.geometry.dynamic = true;

		grid.rotateX(-halfPi);
		scene.add(grid);

	} else if (q === false || q === undefined) {

		grid = new THREE.GridHelper(arenaSize, 6);
		grid.setColors(0x555555,0x555555);
		scene.add(grid);
	}

	rimCoords = [{
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
};
/*–––––––––––––––––––––––––––––––––––––––––*/




/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = function (cfg) {


	var cycle = new THREE.Object3D();


	cycle.model = cycleModel(cfg.colorCode);
	cycle.add(cycle.model);
	

	var loader = new THREE.ObjectLoader();
	loader.load("models/1982.json",function ( obj ) {
		obj.scale.set( 4, 4.1, 3.5 );
		obj.position.y = -2.1;
		obj.position.x = -3;
		obj.rotation.y = -Math.PI/2;
		obj.visible = false;
		cycle.add( obj );
	});



	cycle.position.set(cfg.x, 2, cfg.z);

	cycle.color = cfg.colorCode;
	cycle.lightUpColor = darkestRGB(cfg.colorCode);

	cycle.rotation.set(0,-1.5707963267948966,0);
	cycle.dir = cfg.dir;
	cycle.rotateY(halfPi * cfg.dir);
	
	cycle.walls = new THREE.Object3D();
	cycle.walls.children = [];
	cycle.walls.scale.y = 1;
	cycle.walls.netLength = 0;
	cycle.currentWall;
	scene.add(cycle.walls);

	cycle.turned = false;
	cycle.turnQueue = [];
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
	cycle.AI = cfg.ai;
	cycle.rand = 3.7;

	cycle.playerID = cfg.playerID;

	cycle.name = cfg.name;
	cycle.textLabel;

	cycle.renderList = []; // lets you add/remove stuff to the animation loop dynamically

	cycle.engineType = cfg.engineType;

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
		wallTextureProportion = (texture.image.width / texture.image.height) * 8; // *4 is actual size
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
