/* orignally by Peter Kelley https://github.com/pgkelley4 */

function doLineSegmentsIntersect(p, p2, q, q2) {
	//var r = subtractPoints(p2, p);
	var r = subtractPointsTrajectory(p2, p);
	var s = subtractPoints(q2, q);

	var denominator = crossProduct(r, s);

	if (denominator == 0) {
		// lines are paralell
		return false;
	}
	
	var uNumerator = crossProduct(subtractPoints(q, p), r);

	// if (uNumerator === 0 && denominator === 0) {
	// 	// They are coLlinear
	// 	console.log('coLlinear intersect');
	// 	// Do they touch? (Are any of the points equal?)
	// 	if (equalPoints(p, q) || equalPoints(p, q2) || equalPoints(p2, q) || equalPoints(p2, q2)) {
	// 		return true
	// 	}
	// 	// Do they overlap? (Are all the point differences in either direction the same sign)
	// 	// Using != as exclusive or
	// 	return ((q.x - p.x < 0) != (q.x - p2.x < 0) != (q2.x - p.x < 0) != (q2.x - p2.x < 0)) || 
	// 		((q.z - p.z < 0) != (q.z - p2.z < 0) != (q2.z - p.z < 0) != (q2.z - p2.z < 0));
	// }

	var u = uNumerator / denominator;
	var t = crossProduct(subtractPoints(q, p), s) / denominator;

	return (t > 0) && (t < 1) && (u > 0) && (u < 1);
}

function doAccelLineSegmentsIntersect(p, p2, q, q2) {
	var r = subtractPoints(p2, p);
	var s = subtractPoints(q2, q);

	var denominator = crossProduct(r, s);

	if (denominator == 0) {
		// lines are paralell
		return {
			check: false
		};
	}
	
	var uNumerator = crossProduct(subtractPoints(q, p), r);
	
	var u = uNumerator / denominator;
	var t = crossProduct(subtractPoints(q, p), s) / denominator;

	if ((t >= 0) && (t <= 1) && (u >= 0) && (u <= 1)) {

		var distFromCycle = Math.abs( ((p.x + t * r.x)-lightcycle.position.x) + ((p.z + t * r.z)-lightcycle.position.z) );
		
		return {
			check: true,
			pointDist: distFromCycle
		}
	} else {
		return {
			check: false
		};
	}

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

function subtractPointsTrajectory(point1, point2) {
	var result = {};
	result.x = point1.x - point2.x;
	result.z = point1.z - point2.z;

	// result.x += Math.sign(result.x) * 5;
	// result.z += Math.sign(result.z) * 5; // thought this would be more efficient than lightcycle.translateX(5), but it's buggy

	lookAheadLine.position.x = point2.x; 
	lookAheadLine.position.z = point2.z;

	lookAheadLine2.position.x = point1.x;
	lookAheadLine2.position.z = point1.z;

	return result;
}