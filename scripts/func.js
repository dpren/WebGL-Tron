"use strict";

var constrain = function(min, max) {
	return function (n) {
    	return Math.max(min, Math.min(n, max));
	};
};


var normal_random = function(mean, variance) {
	var V1, V2, S, X;
	if (mean == undefined) {
		mean = 0.0;
	}
	if (variance == undefined) {
		variance = 1.0;
	}
	do {
		var U1 = Math.random();
		var U2 = Math.random();
		V1 = 2 * U1 - 1;
		V2 = 2 * U2 - 1;
		S = V1 * V1 + V2 * V2;
	} while (S > 1);

	X = Math.sqrt(-2 * Math.log(S) / S) * V1;
	X = mean + Math.sqrt(variance) * X;
	return X;
};


var createLabel = function(name) {
	var text = document.createElement('div');
	text.setAttribute('class', 'playerLabel');
	text.setAttribute('id', name);
	text.innerHTML = name;
	document.getElementById('player-labels').appendChild(text);
	return text;
};


var toScreenPosition = function(obj, camera) {
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y
    };

};

// to hide offscreen labels
// function checkPinVisibility() {
//     var cameraToEarth = earth.position.clone().sub(camera.position);
//     var L = Math.sqrt(Math.pow(cameraToEarth.length(), 2) - Math.pow(earthGeometry.parameters.radius, 2));

//     for (var i = 0; i < pins.length; i++) { 

//         var cameraToPin = pins[i].position.clone().sub(camera.position);

//         if(cameraToPin.length() > L) { 
//             pins[i].domlabel.style.visibility = "hidden";
//         } else { 
//             pins[i].domlabel.style.visibility = "visible";
//         }
//     }
// }

var fadeInLabel = function(cycle) {
	cycle.textLabel.style.opacity = 0;
	return function () {
		
		cycle.textLabel.style.opacity = cycle.textLabel.style.opacity*1 + .04;

		if (cycle.textLabel.style.opacity >= 0.85) {

			cycle.renderList.splice( cycle.renderList.indexOf(this), 1);
		}
	};
};


var sanitize = function(str) {
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str; //.trim();
};


var hexToRGB = function(hex) {
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r,g,b];
}


var darkestRGB = function(hex) {
	var rgb = hexToRGB(hex);
	var darkest = R.indexOf(R.min(rgb), rgb);
	if (darkest === 0) {
		return 'r';
	} else if (darkest === 1) {
		return 'g';
	} else {
		return 'b';
	}
};





// returns array index with smallest .dist property
var minDistIndex = function(array) {

	var minObj = R.minBy(function (obj) {
		return obj.dist;
	}, array);
	
	var minIndex = R.indexOf(minObj, array);

	return minIndex;
};



var distanceBetween = function(p1, p2) {
	return Math.abs( (p2.x - p1.x) + (p2.z - p1.z) );
};






var changeViewTargetTo = function(i) {
	
	viewTarget = i;

	var alivePlayersLength = R.findLastIndex(R.propEq('alive', true))(activePlayers);

	if (viewTarget > alivePlayersLength) {
		viewTarget = 0;
	} else if (viewTarget < 0) {
		viewTarget = alivePlayersLength;
	}

	//console.log("view:", viewTarget, " alive:", R.findLastIndex(R.propEq('alive', true))(activePlayers), " activePlayers:", activePlayers.length-1);

	cameraOrbit.target = activePlayers[viewTarget].position;
};


var fixCockpitCam = function() {
	activePlayers.forEach( function (cycle) {
		if (cycle.walls.children.length) {
			cycle.walls.children[ cycle.walls.children.length-1 ].visible = true;
		}
		cycle.model.visible = true;
	});
};


var hideElement = function(elem, el2) {
	var hide = function() {
		elem.style.visibility = 'hidden';
		elem.style.opacity = 1;
		el2.style.display = 'none';
	};
	elem.style.opacity = 1;
	(function fadeOut() {
		(elem.style.opacity -= .1) < 0 ? hide() : setTimeout(fadeOut, 40)
	}());
};


var pause = function() {
	paused = !paused;
	if (paused === true) {
		pauseMsg.style.visibility = "visible";
		activePlayers.forEach( function (player) {
			player.audio.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
		});
	} else {
		pauseMsg.style.visibility = "hidden";
		activePlayers.forEach( function (player) {
			player.audio.gain.setTargetAtTime(6, ctx.currentTime, 0.02);
			player.turnStack = []; // clear in case turn keys were pressed while paused
		});
	}
};


var animateCycle = function(cycle) {
	return function () {
		cycle.model.children[1].rotation.y -= cycle.speed/3.2;
		cycle.model.children[2].rotation.y -= cycle.speed/2;
		cycle.model.children[4].rotation.y -= cycle.speed/3.2;
		cycle.model.children[5].rotation.y -= cycle.speed/2;
		cycle.model.children[6].rotation.x += cycle.speed/3;
	};
};