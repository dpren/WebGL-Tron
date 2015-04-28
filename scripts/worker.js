/////////////////////////////////////////
/* just a test for possible future use */
/////////////////////////////////////////

self.addEventListener('message', function(event) {
  

    var checkResult = wallCollisionCheck(event.data.cycle, event.data.turns, event.data.grid);


    // send back the results
    self.postMessage(checkResult);
});





var wallCollisionCheck = function (cycleTrajectory, turnCoords, gridSize) {

    var intersect;
    var collision = false;
    var wnum;
    var wn;
    var length = turnCoords.length;

    for (wn = 2; wn < length; wn += 1) {

        intersect = doLineSegmentsIntersect(
                                    turnCoords[length-1],
                                    cycleTrajectory,
                                    turnCoords[wn-2],
                                    turnCoords[wn-1]
                                    );

        if (intersect === true) {
            wnum = wn-2;
            collision = true;
        }
    }

    if (Math.abs(cycleTrajectory.x) >= gridSize || Math.abs(cycleTrajectory.z) >= gridSize) {
        
        collision = true;
    }

    return {
        collision: collision,
        wn: wnum
    }
};

function doLineSegmentsIntersect(p, p2, q, q2) {
    var r = subtractPoints(p2, p);
    var s = subtractPoints(q2, q);

    var denominator = crossProduct(r, s);

    if (denominator == 0) {
        return false;
    };
    
    var uNumerator = crossProduct(subtractPoints(q, p), r);


    var u = uNumerator / denominator;
    var t = crossProduct(subtractPoints(q, p), s) / denominator;

    return (t > 0) && (t < 1) && (u > 0) && (u < 1);
}

function crossProduct(point1, point2) {
    return point1.x * point2.z - point1.z * point2.x;
}

function subtractPoints(point1, point2) {
    var result = {};
    result.x = point1.x - point2.x;
    result.z = point1.z - point2.z;

    return result;
}



// var worker = new Worker('scripts/worker.js');
// worker.onmessage = function(e) {
//  collision = e.data.collision;
//  if (collision === true) {
//      handleCollision(lightcycle1, e.data.wn);
//  }
// }
// var wallCheckWorker = function (cycle) { 
//  var cycleTrajectory = cycle.clone().translateX( rubberDistance );
//  worker.postMessage({
//    cycle: cycleTrajectory.position,
//    turns: cycle.turnCoords,
//    grid: gridSize
//  });
// };