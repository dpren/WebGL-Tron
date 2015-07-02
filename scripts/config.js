"use strict";



var grid;
var arenaSize = 390;
var gridTileSize = 3;
var gridHQ = false;

var easing = 0.08;

var maxTailLength = 2000;

var turnDelay = 0.02;

var maxRubber = 5;
var maxSpeed = 5;
var maxBrakes = 5;

var rubberMinDistance = 2.5;
var rubberMinAdjust = 0.5;
var digFactor = 0.4;

var rubberUseFactor = 0.08; // higher consumes faster
var rubberRestoreFactor = 0.03; // higher restores faster

var brakeUseFactor = 0.05;
var brakeRestoreFactor = 0.05;

var brakeFactor = 0.5;
var boostFactor = 1.5;
var turnSpeedFactor = 0.05;

var wallAccelRange = 15;
var wallAccelFactor = 1.5;

var regularSpeed = maxSpeed/3;
var startingSpeed = regularSpeed/2;
var cycleEnginePitchFactor = regularSpeed/1;

var explode = {
	velocity: 3,
	particleCount: 200,
	particleSize: 0.8,
	time: 3,
	decay: .98
};

var panningModel = "equalpower";
var altCycleModel = false;
