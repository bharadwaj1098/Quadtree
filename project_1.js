// some globals
//<button class="button button1">Green</button>
var gl;

var theta = 0.0;

var thetaLoc, colorLoc;
var mouse_down = false;
var tri_click = false;
var line_click = false;
var line_count = -1;
var delay = 100;
var direction = true;
var vBuffer, cBuffer;
var vBuffer_line, cBuffer_line;

var program_points;
var quad_1, quad_2, quad_3, quad_4;
var x, y, ndc_x, ndc_y, wc_x, wc_y, z, ndc_z, wc_z;
var points = [];
var points_color = [];
var coordinates;
var max_prims = 200, num_triangles = 0;
var b = 0;
var vColor;
var border_lines_color = []
var single_line = []
var triangle = [];
// var triangle_color = [];

var lines = [];
var lines_color = [];

var all_lines = [];
window.onload = function init() {
	refresh();

}
function refresh() {
	document.getElementById("draw_lines").onclick = function () {
		line_click = !line_click;
		document.getElementById("draw_lines").innerHTML = "Draw lines is " + line_click;
	}
	var canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.5, 0.5, 0.5, 1.0);

	var first = 0
	var second = 0
	var third = 0
	var fourth = 0

	for (var c = 0; c < 1000; c++) {
		i = random(0.74, -0.74);
		j = random(0.74, -0.74);
		if (i > 0 && j > 0 && first < 100) {
			points.push([i, j, 0, 1]);
			points_color.push([1, 0, 0, 1]);
			first++;
		} 
		if (i < 0 && j > 0 && second < 20) {
			points.push([i, j, 0, 1]);
			points_color.push([1, 0, 0, 1]);
			second++;
		}
		if (i < 0 && j < 0 && third < 70) {
			points.push([i, j, 0, 1]);
			points_color.push([1, 0, 0, 1]);
			third++;
		}
		if (i > 0 && j < 0 && fourth < 20) {
			points.push([i, j, 0, 1]);
			points_color.push([1, 0, 0, 1]);
			fourth++;
		}
	}

	var x_min = points[0][0]
	var x_max = points[0][0]
	for (var i = 1; i < points.length; i++) {
		var k = points[i][0]
		if (k < x_min)
			x_min = k
		x_min = Math.round(x_min * 100) / 100
		if (x_max < k)
			x_max = k
		x_max = Math.round(x_max * 100) / 100
	}

	var y_min = points[0][1]
	var y_max = points[0][1]
	for (var i = 1; i < points.length; i++) {
		var k = points[i][1]
		if (k < y_min)
			y_min = k
		y_min = Math.round(y_min * 100) / 100
		if (y_max < k)
			y_max = k
		y_max = Math.round(y_max * 100) / 100
	}


	var border_lines = [[x_max + 0.01, y_max + 0.01, 0, 1], [x_min - 0.01, y_max + 0.01, 0, 1],
	[x_min - 0.01, y_max + 0.01, 0, 1], [x_min - 0.01, y_min - 0.01, 0, 1],
	[x_min - 0.01, y_min - 0.01, 0, 1], [x_max + 0.01, y_min - 0.01, 0, 1],
	[x_max + 0.01, y_min - 0.01, 0, 1], [x_max + 0.01, y_max + 0.01, 0, 1]]

	for (var i = 0; i < border_lines.length; i++) {
		all_lines.push(border_lines[i]);
	}
	// single_line(canvas);
	canvas.addEventListener('mousedown', e => {
		x = e.offsetX;
		y = e.offsetY;

		ndc_x = (x - 256) / 256;
		ndc_y = (256 - y) / 256;
		if (line_click === true) {
			line_count += 1;
			if (line_count < 2) {
				all_lines.push([ndc_x, ndc_y, 0, 1]);
			}
			if (line_count == 1) {
				line_count = -1;
				p = intersection_points(all_lines, points)
				for(var i =0; i<p.length; i++)
					points.push(p[i])
				gl.clear(gl.COLOR_BUFFER_BIT);
				// point_render();

				render(all_lines);
				point_render();

			}
		}
	});
	bb = new BOX(border_lines)
	Q = new QuadTree(bb);

	Q.quad();
	gl.clear(gl.COLOR_BUFFER_BIT);
	render(all_lines);

	point_render();

};

function render(border_lines) {

	var program_lines = initShaders(gl, "vertex-shader-lines", "fragment-shader");
	gl.useProgram(program_lines);

	for (var i = 0; i < border_lines.length; i++)
		border_lines_color.push([0, 0, 0, 1])
	vBuffer_line = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_line);
	// gl.bufferData(gl.ARRAY_BUFFER, flatten(border_lines), gl.STATIC_DRAW);
	gl.bufferData(gl.ARRAY_BUFFER, 30000, gl.STATIC_DRAW);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(border_lines));

	var vPosition = gl.getAttribLocation(program_lines, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	cBuffer_line = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer_line);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(border_lines_color), gl.STATIC_DRAW);
	var vColor = gl.getAttribLocation(program_lines, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	gl.drawArrays(gl.LINES, 0, border_lines.length);

}


function point_render() {

	program_points = initShaders(gl, "vertex-shader-points", "fragment-shader");
	gl.useProgram(program_points);

	vBuffer_points = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_points);
	gl.bufferData(gl.ARRAY_BUFFER, 30000, gl.STATIC_DRAW);
	gl.bufferSubData(gl.ARRAY_BUFFER, new Float32Array(points), flatten(points) );

	coordinates = gl.getAttribLocation(program_points, "coordinates");
	gl.vertexAttribPointer(coordinates, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(coordinates);

	cBuffer_points = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer_points);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points_color), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program_points, "vColor_points");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	// console.log(points)
	gl.drawArrays(gl.POINTS, 0, points.length);
};

class BOX {
	constructor(border_lines) {
		this.root = border_lines
		this.quad_1 = null
		this.quad_2 = null
		this.quad_3 = null
		this.quad_4 = null
	}
}
class QuadTree {
	constructor(big_box) {
		this.big_box = big_box
	}
	quad() {
		let big_box = this.big_box
		let lines = big_box.root
		let midpoints = []
		midpoints.push(lines[0].map((a, i) => (a + lines[1][i]) / 2))
		midpoints.push(lines[4].map((a, i) => (a + lines[5][i]) / 2))
		midpoints.push(lines[2].map((a, i) => (a + lines[3][i]) / 2))
		midpoints.push(lines[6].map((a, i) => (a + lines[7][i]) / 2))
		let center = midpoints[0].map((a, i) => (a + midpoints[1][i]) / 2)
		let k = this.check(big_box.root)
		if (k > 4) {
			//this.draw(midpoints)
			for (var i = 0; i < midpoints.length; i++) {
				all_lines.push(midpoints[i]);
			}
			// all_lines.push(midpoints);
			big_box.quad_1 = [lines[0], midpoints[0], midpoints[0], center,
				center, midpoints[3], midpoints[3], lines[0]]
			big_box.quad_2 = [midpoints[0], lines[1], lines[1], midpoints[2],
			midpoints[2], center, center, midpoints[0]]
			big_box.quad_3 = [center, midpoints[2], midpoints[2], lines[3],
				lines[3], midpoints[1], midpoints[1], center]
			big_box.quad_4 = [midpoints[3], center, center, midpoints[1],
			midpoints[1], lines[5], lines[5], midpoints[3]]

			// let k = this.check(big_box.root)

			let k_1 = new BOX(big_box.quad_1)
			let one = new QuadTree(k_1)
			one.quad()

			let k_2 = new BOX(big_box.quad_2)
			let two = new QuadTree(k_2)
			two.quad()

			let k_3 = new BOX(big_box.quad_3)
			let three = new QuadTree(k_3)
			three.quad()

			let k_4 = new BOX(big_box.quad_4)
			let four = new QuadTree(k_4)
			four.quad()
		}


	}


	check(quad) {
		let temp = []
		temp.push(quad[0].map((a, i) => (a + quad[1][i]) / 2))
		temp.push(quad[4].map((a, i) => (a + quad[5][i]) / 2))
		temp.push(quad[2].map((a, i) => (a + quad[3][i]) / 2))
		temp.push(quad[6].map((a, i) => (a + quad[7][i]) / 2))
		let count = 0
		for (var i = 0; i < points.length; i++) {
			var x = points[i][0]
			var y = points[i][1]
			if (x < temp[3][0] && x > temp[2][0]) {
				if (y < temp[0][1] && y > temp[1][1])
					count++;
			}
		}
		return count
	}


}

function random(mn, mx) {
	return Math.random() * (mx - mn) + mn;
}

function translate2d(tx, ty) {
	var t = [[1, 0, tx, 0], [0, 1, ty, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
	return t;
};

function scale2d(sx, sy) {
	var s = [[sx, 0, 0, 0], [0, sy, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
	return s;
};

// https://stackoverflow.com/questions/27205018/multiply-2-matrices-in-javascript
function dotprod(a, b) {
	var aNumRows = a.length, aNumCols = a[0].length,
		bNumRows = b.length, bNumCols = b[0].length,
		m = new Array(aNumRows);  // initialize array of rows
	for (var r = 0; r < aNumRows; ++r) {
		m[r] = new Array(bNumCols); // initialize the current row
		for (var c = 0; c < bNumCols; ++c) {
			m[r][c] = 0;             // initialize the current cell
			for (var i = 0; i < aNumCols; ++i) {
				m[r][c] += a[r][i] * b[i][c];
			}
		}
	}
	return m;
};

//http://paulbourke.net/geometry/pointlineplane/
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
	if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
		return false
	}
	jj = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
	if (jj === 0) {
		return false
	}
	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / jj
	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / jj

	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
		return false
	}

	let x = x1 + ua * (x2 - x1)
	let y = y1 + ua * (y2 - y1)

	return [ x, y, 0, 1 ]
}

function intersection_points(Lines, Points){
	var p =[]
	var pairs = splitPairs(Lines)
	var last_two = pairs.slice(-1)[0]
	for (var i = 0; i<pairs.length-1; i++){
		var l = pairs[i]
		var kk = intersect(last_two[0][0], last_two[0][1], last_two[1][0], last_two[1][1],
			l[0][0], l[0][1], l[1][0], l[1][1])
		if(kk!=false){
			//Points.push[kk[0]]
			p.push(kk)
			}
	}	
	// console.log(p[0])
	return p
	
}

var splitPairs = function(Lines) {
	var pairs = [];
	for (var i=0 ; i<Lines.length ; i+=2) {
		if (Lines[i+1] !== undefined) {
			pairs.push ([Lines[i], Lines[i+1]]);
		} else {
			pairs.push ([Lines[i]]);
		}
	}
	return pairs;
};