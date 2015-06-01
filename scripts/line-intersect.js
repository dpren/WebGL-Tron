/* orignally by Peter Kelley https://github.com/pgkelley4 */

function doLineSegmentsIntersect(p, p2, q, q2) {
	var r = subtractPoints(p2, p);
	var s = subtractPoints(q2, q);

	var denominator = crossProduct(r, s);

	if (denominator == 0) { // lines are paralell
		return {
			check: false
		};
	};
	
	var uNumerator = crossProduct(subtractPoints(q, p), r);

	var u = uNumerator / denominator;
	var t = crossProduct(subtractPoints(q, p), s) / denominator;

	return {
		check: ((t > 0) && (t < 1) && (u > 0) && (u < 1)),
		x: (p.x + t * r.x),
		z: (p.z + t * r.z)
	};
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