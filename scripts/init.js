"use strict";

var clock = new THREE.Clock();
var elapsedTime;
var delta;
var frameTime = 0;


var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000 );
	camera.position.set(-550, 250, 100);


var cameraOrbit = new THREE.OrbitControls(camera);
	cameraOrbit.maxDistance = 400;


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
stats.domElement.style.visibility = 'hidden';
document.body.appendChild( stats.domElement );


var pauseMsg = document.getElementById('pause-msg');
	pauseMsg.style.visibility = "hidden";
var pressZ = document.getElementById('press-z');
var pressX = document.getElementById('press-x');

var gauge = {
	rubber: {
		val: document.getElementById('rubber-val'),
		bar: document.getElementById('rubber-bar'),
		max: document.getElementById('rubber-max'),
		maxVal: maxRubber
	},
	speed: {
		val: document.getElementById('speed-val'),
		bar: document.getElementById('speed-bar'),
		max: document.getElementById('speed-max'),
		maxVal: maxSpeed
	},
	brakes: {
		val: document.getElementById('brake-val'),
		bar: document.getElementById('brake-bar'),
		max: document.getElementById('brake-max'),
		maxVal: maxBrakes
	}
};



var constrainSpeed = constrain(regularSpeed*.7, maxSpeed);
var halfPi = Math.PI/2;


var otherPlayers = [];
var activePlayers = [];
var rimCoords = [];


var paused = true;
var showInfo = false;
var view = 0;
var viewTarget = 0;
