function isWebGLSupported () {
		
    var canvas = document.createElement('canvas');
	
    var gl;
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } 
	catch (e) {
        return false;
    }
    if (!gl || !gl.getExtension('OES_texture_float') || !gl.getExtension('OES_texture_float_linear')) {
        return false;
    }
    return true;
};

function programWrapper (gl, vertexShader, fragmentShader, attributeLocations) {
		
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    for (var attributeName in attributeLocations) {
		
        gl.bindAttribLocation(program, attributeLocations[attributeName], attributeName);
    }
    gl.linkProgram(program);
	
    var uniformLocations = {};
    var numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < numberOfUniforms; i += 1) {
		
        var activeUniform = gl.getActiveUniform(program, i);
		var uniformLocation = gl.getUniformLocation(program, activeUniform.name);
        uniformLocations[activeUniform.name] = uniformLocation;
    }

    this.getUniformLocation = function (name) {
        return uniformLocations[name];
    };

    this.getProgram = function () {
        return program;
    }
};

function buildShader (gl, type, source) {
	
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
};

function buildTexture (gl, url, internalFormat, wrapS, wrapT, minFilter, magFilter) {
	
	var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
	
	var srcFormat = gl.RGBA;
	var srcType = gl.UNSIGNED_BYTE;
	
	var image = new Image();
	// image.crossOrigin = '';
	// image.addEventListener('error', function (e) {
	// 	console.log(e.message);
	// 	alert(url + " load error: " + JSON.stringify(e));
	// });
	image.addEventListener('load', function () {

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0,	internalFormat,	srcFormat, srcType, image);
			
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
		gl.generateMipmap(gl.TEXTURE_2D);
	});
	image.src = url;
	
    return texture;
};    	

var netPostRadius = 0.1;
function getNetPostGeometry() {
	
	var height = 1.07,
		netPostRadius = 0.1,
		sections = 20,
		subdivisions = 100,
		deltax = (Math.PI * 2) / subdivisions,
		deltay = height / sections;
		
	var triData = [];
		
	// plot main cylinder
	for (var y = 0; y < sections; y++) {
		
		for (var x = 0; x < subdivisions; x++) {
		
			var px0 = netPostRadius * Math.cos(x * deltax),
				pz0 = netPostRadius * Math.sin(x * deltax),
				px1 = netPostRadius * Math.cos((x + 1) * deltax),
				pz1 = netPostRadius * Math.sin((x + 1) * deltax);
				
			triData.push(px0);
			triData.push(y * deltay);
			triData.push(pz0);
			
			triData.push(px0);
			triData.push((y + 1) * deltay);
			triData.push(pz0);
			
			triData.push(px1);
			triData.push(y * deltay);
			triData.push(pz1);
			
			
			triData.push(px0);
			triData.push((y + 1) * deltay);
			triData.push(pz0);
			
			triData.push(px1);
			triData.push(y * deltay);
			triData.push(pz1);
			
			triData.push(px1);
			triData.push((y + 1) * deltay);
			triData.push(pz1);
		}
	}
	
	return triData;
};

function getNetHeight (zOffs) {
			
	// 0.91 = net height in the centre, 1.07 = net height at post, 5.02
	var tanTheta = (1.07 - 0.91) / 5.02;
	// the net sags instead of is in a straight, taut line... but the straight line will do as a rough estimate for now
	return 0.91 + (zOffs * tanTheta);
};

function getNetGeometry() {
	
	var netData = [];	
	
	// net cord top half
	netData.push(0.0);
	netData.push(0.91); // net height in the centre		
	netData.push(0.0)
	// p1
	netData.push(0.0);
	netData.push(1.07);
	netData.push(5.02);	// net height in the centre
	
	// net cord bottom half
	netData.push(0.0);
	netData.push(0.91); // net height in the centre		
	netData.push(0.0)
	// p1
	netData.push(0.0);
	netData.push(1.07);	// net height at the post
	netData.push(-5.02);
	
	// centre line drop
	netData.push(0.0);
	netData.push(0.91); // net height in the centre		
	netData.push(0.0)
	// p1
	netData.push(0.0);
	netData.push(0.1);
	netData.push(0.0);
	
	var netRows = 10;	
	for (var y = 0; y < netRows; y++) {
		
		netData.push(0);
		netData.push(y * (1.07 / netRows))
		netData.push(-(5.02 - netPostRadius));
		
		netData.push(0);
		netData.push(y * (0.91 / netRows))
		netData.push(0);
		
		
		netData.push(0);
		netData.push(y * (1.07 / netRows))
		netData.push(5.02 - netPostRadius);
		
		netData.push(0);
		netData.push(y * (0.91 / netRows))
		netData.push(0);		
	}
	
	var netColumns = 24;
	for (var z = 0; z < netColumns; z++) {
	
		var netHeight = getNetHeight(z * (5.02 / netColumns));
		
		netData.push(0);
		netData.push(netHeight);		
		netData.push(z * (5.02 / netColumns));
		
		netData.push(0);
		netData.push(0);
		netData.push(z * (5.02 / netColumns));
		
		
		netData.push(0);
		netData.push(netHeight);		
		netData.push(-z * (5.02 / netColumns));
		
		netData.push(0);
		netData.push(0);
		netData.push(-z * (5.02 / netColumns));
	}
	
	return netData;
};

		
function getLinesGeometry() {
	
	var lineData = [];
	
	var lineWidth = 0.0762; // 3" wide... doesn't need to be precise
	
	// base line, left
	lineData.push(-11.88);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-11.88);
	lineData.push(0);
	lineData.push(-4.11);
	
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(-11.88);
	lineData.push(0);
	lineData.push(-4.11);
	
	// base line left, centre notch (TODO)
	
	// base line, right
	lineData.push(11.88);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(11.88);
	lineData.push(0);
	lineData.push(-4.11);
	
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(11.88);
	lineData.push(0);
	lineData.push(-4.11);
	
	// side line, top
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(4.11 - lineWidth);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(4.11 - lineWidth);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(4.11 - lineWidth);
	
	// side line, bottom
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(-(4.11 - lineWidth));
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(-(4.11 - lineWidth));
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(-(4.11 - lineWidth));
	
	// service line, left
	lineData.push(-6.4);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-(6.4 - lineWidth));
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-6.4);
	lineData.push(0);
	lineData.push(-4.11);
	
	
	lineData.push(-(6.4 - lineWidth));
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(-(6.4 - lineWidth));
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(-6.4);
	lineData.push(0);
	lineData.push(-4.11);
	
	
	// service line, right
	lineData.push(6.4);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(6.4 - lineWidth);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(6.4);
	lineData.push(0);
	lineData.push(-4.11);
	
	
	lineData.push(6.4 - lineWidth);
	lineData.push(0);
	lineData.push(4.11);
	
	lineData.push(6.4 - lineWidth);
	lineData.push(0);
	lineData.push(-4.11);
	
	lineData.push(6.4);
	lineData.push(0);
	lineData.push(-4.11);
	
	
	var halfLineWidth = lineWidth / 2.0;
	// service line, centre
	lineData.push(-(6.4 - halfLineWidth));
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(6.4 - halfLineWidth);
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(-(6.4 - halfLineWidth));
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	
	lineData.push(6.4 - halfLineWidth);
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(-(6.4 - halfLineWidth));
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	lineData.push(6.4 - halfLineWidth);
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	
	// baseline notch, left
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(-(11.88 - (lineWidth * 2)));
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	
	lineData.push(-(11.88 - (lineWidth * 2)));
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(-(11.88 - lineWidth));
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	lineData.push(-(11.88 - (lineWidth * 2)));
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	
	// baseline notch, right
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(11.88 - (lineWidth * 2));
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	
	lineData.push(11.88 - (lineWidth * 2));
	lineData.push(0);
	lineData.push(-halfLineWidth);
	
	lineData.push(11.88 - lineWidth);
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	lineData.push(11.88 - (lineWidth * 2));
	lineData.push(0);
	lineData.push(halfLineWidth);
	
	return lineData;
};

function getCourtGeometry() {
	
	var courtData = [];
	
	// We're going outside the actual playing surface with this
	var buffer = 2.0;
		
	// Tri 0
	courtData.push(-(11.88 + buffer));
	courtData.push(0);
	courtData.push(-(4.11 + buffer));
	
	courtData.push( (11.88 + buffer));
	courtData.push(0);
	courtData.push(-(4.11 + buffer));
	
	courtData.push(-(11.88 + buffer));
	courtData.push(0);
	courtData.push( (4.11 + buffer));
	
	
	// Tri 1
	courtData.push( (11.88 + buffer));
	courtData.push(0);
	courtData.push(-(4.11 + buffer));
	
	courtData.push( (11.88 + buffer));
	courtData.push(0);
	courtData.push( (4.11 + buffer));
	
	courtData.push(-(11.88 + buffer));
	courtData.push(0);
	courtData.push( (4.11 + buffer));
	
	return courtData;
};
