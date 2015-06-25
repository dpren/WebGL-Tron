"use strict";



var arenaSize = 390;
var gridTileSize = 3;

var easing = 0.08;

var blastRadius = 1.5;

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
var wallAccelFactor = 200;

var regularSpeed = maxSpeed/3;
var startingSpeed = regularSpeed/2;

var panningModel = "equalpower";