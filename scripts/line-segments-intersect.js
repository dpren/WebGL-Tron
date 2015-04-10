/**
 * @author Peter Kelley
 * @author pgkelley4@gmail.com
 */

/**
 * See if two line segments intersect. This uses the 
 * vector cross product approach described below:
 * http://stackoverflow.com/a/565282/786339
 * 
 * @param {Object} p point object with x and z coordinates
 *  representing the start of the 1st line.
 * @param {Object} p2 point object with x and z coordinates
 *  representing the end of the 1st line.
 * @param {Object} q point object with x and z coordinates
 *  representing the start of the 2nd line.
 * @param {Object} q2 point object with x and z coordinates
 *  representing the end of the 2nd line.
 */
function doLineSegmentsIntersect(p, p2, q, q2) {
	var r = subtractPoints(p2, p);
	var s = subtractPoints(q2, q);

	var denominator = crossProduct(r, s);

	if (denominator == 0) {
		// lines are paralell
		return false;
	}
	
	var uNumerator = crossProduct(subtractPoints(q, p), r);

	// if (uNumerator == 0 && denominator == 0) {
	// 	// They are coLlinear
		
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

	return (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
}

/**
 * Calculate the cross product of the two points.
 * 
 * @param {Object} point1 point object with x and z coordinates
 * @param {Object} point2 point object with x and z coordinates
 * 
 * @return the cross product result as a float
 */
function crossProduct(point1, point2) {
	return point1.x * point2.z - point1.z * point2.x;
}

/**
 * Subtract the second point from the first.
 * 
 * @param {Object} point1 point object with x and z coordinates
 * @param {Object} point2 point object with x and z coordinates
 * 
 * @return the subtraction result as a point object
 */ 
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

	result.x += Math.sign(result.x) * 5;
	result.z += Math.sign(result.z) * 5;

	return result;
}

/**
 * See if the points are equal.
 *
 * @param {Object} point1 point object with x and z coordinates
 * @param {Object} point2 point object with x and z coordinates
 *
 * @return if the points are equal
 */
// function equalPoints(point1, point2) {
// 	return (point1.x == point2.x) && (point1.z == point2.z)
// }