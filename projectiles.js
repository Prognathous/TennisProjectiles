var simulator;

(function () {	
	
    'use strict';
	
	var SIZE_OF_FLOAT = 4;	
	var CLEAR_COLOR = [0.9, 0.9, 0.9, 1.0];
		
	var clamp = function (x, min, max) {
        return Math.min(Math.max(x, min), max);
    };

    var epsilon = function (x) {
        return Math.abs(x) < 0.000001 ? 0 : x;
    };

	// Matrices section
    var makeIdentityMatrix = function (matrix) {
		
        matrix[0] = 1.0;
        matrix[1] = 0.0;
        matrix[2] = 0.0;
        matrix[3] = 0.0;
        matrix[4] = 0.0;
        matrix[5] = 1.0;
        matrix[6] = 0.0;
        matrix[7] = 0.0;
        matrix[8] = 0.0;
        matrix[9] = 0.0;
        matrix[10] = 1.0;
        matrix[11] = 0.0;
        matrix[12] = 0.0;
        matrix[13] = 0.0;
        matrix[14] = 0.0;
        matrix[15] = 1.0;
        return matrix;
    };

    var makeXRotationMatrix = function (matrix, angle) {
		
        matrix[0] = 1.0;
        matrix[1] = 0.0;
        matrix[2] = 0.0;
        matrix[3] = 0.0;
        matrix[4] = 0.0;
        matrix[5] = Math.cos(angle);
        matrix[6] = Math.sin(angle);
        matrix[7] = 0.0;
        matrix[8] = 0.0;
        matrix[9] = -Math.sin(angle);
        matrix[10] = Math.cos(angle);
        matrix[11] = 0.0;
        matrix[12] = 0.0;
        matrix[13] = 0.0;
        matrix[14] = 0.0;
        matrix[15] = 1.0;
        return matrix;
    };

    var makeYRotationMatrix = function (matrix, angle) {
		
        matrix[0] = Math.cos(angle);
        matrix[1] = 0.0
        matrix[2] = -Math.sin(angle);
        matrix[3] = 0.0
        matrix[4] = 0.0
        matrix[5] = 1.0
        matrix[6] = 0.0;
        matrix[7] = 0.0;
        matrix[8] = Math.sin(angle);
        matrix[9] = 0.0
        matrix[10] = Math.cos(angle);
        matrix[11] = 0.0;
        matrix[12] = 0.0;
        matrix[13] = 0.0;
        matrix[14] = 0.0;
        matrix[15] = 1.0;
        return matrix;
    };

    var setVector4 = function (out, x, y, z, w) {
		
        out[0] = x;
        out[1] = y;
        out[2] = z;
        out[3] = w;
        return out;
    }

    var projectVector4 = function (out, v) {
		
        var reciprocalW = 1 / v[3];
        out[0] = v[0] * reciprocalW;
        out[1] = v[1] * reciprocalW;
        out[2] = v[2] * reciprocalW;
        return out;
    };

    var transformVectorByMatrix = function (out, v, m) {
		
        var x = v[0], y = v[1], z = v[2], w = v[3];
        out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
        return out;
    };

    var invertMatrix = function (out, m) {
		
        var m0 = m[0], m4 = m[4], m8 = m[8], m12 = m[12],
            m1 = m[1], m5 = m[5], m9 = m[9], m13 = m[13],
            m2 = m[2], m6 = m[6], m10 = m[10], m14 = m[14],
            m3 = m[3], m7 = m[7], m11 = m[11], m15 = m[15],

            temp0 = m10 * m15,
            temp1 = m14 * m11,
            temp2 = m6 * m15,
            temp3 = m14 * m7,
            temp4 = m6 * m11,
            temp5 = m10 * m7,
            temp6 = m2 * m15,
            temp7 = m14 * m3,
            temp8 = m2 * m11,
            temp9 = m10 * m3,
            temp10 = m2 * m7,
            temp11 = m6 * m3,
            temp12 = m8 * m13,
            temp13 = m12 * m9,
            temp14 = m4 * m13,
            temp15 = m12 * m5,
            temp16 = m4 * m9,
            temp17 = m8 * m5,
            temp18 = m0 * m13,
            temp19 = m12 * m1,
            temp20 = m0 * m9,
            temp21 = m8 * m1,
            temp22 = m0 * m5,
            temp23 = m4 * m1,

            t0 = (temp0 * m5 + temp3 * m9 + temp4 * m13) - (temp1 * m5 + temp2 * m9 + temp5 * m13),
            t1 = (temp1 * m1 + temp6 * m9 + temp9 * m13) - (temp0 * m1 + temp7 * m9 + temp8 * m13),
            t2 = (temp2 * m1 + temp7 * m5 + temp10 * m13) - (temp3 * m1 + temp6 * m5 + temp11 * m13),
            t3 = (temp5 * m1 + temp8 * m5 + temp11 * m9) - (temp4 * m1 + temp9 * m5 + temp10 * m9),

            d = 1.0 / (m0 * t0 + m4 * t1 + m8 * t2 + m12 * t3);
            
        out[0] = d * t0;
        out[1] = d * t1;
        out[2] = d * t2;
        out[3] = d * t3;
        out[4] = d * ((temp1 * m4 + temp2 * m8 + temp5 * m12) - (temp0 * m4 + temp3 * m8 + temp4 * m12));
        out[5] = d * ((temp0 * m0 + temp7 * m8 + temp8 * m12) - (temp1 * m0 + temp6 * m8 + temp9 * m12));
        out[6] = d * ((temp3 * m0 + temp6 * m4 + temp11 * m12) - (temp2 * m0 + temp7 * m4 + temp10 * m12));
        out[7] = d * ((temp4 * m0 + temp9 * m4 + temp10 * m8) - (temp5 * m0 + temp8 * m4 + temp11 * m8));
        out[8] = d * ((temp12 * m7 + temp15 * m11 + temp16 * m15) - (temp13 * m7 + temp14 * m11 + temp17 * m15));
        out[9] = d * ((temp13 * m3 + temp18 * m11 + temp21 * m15) - (temp12 * m3 + temp19 * m11 + temp20 * m15));
        out[10] = d * ((temp14 * m3 + temp19 * m7 + temp22 * m15) - (temp15 * m3 + temp18 * m7 + temp23 * m15));
        out[11] = d * ((temp17 * m3 + temp20 * m7 + temp23 * m11) - (temp16 * m3 + temp21 * m7 + temp22 * m11));
        out[12] = d * ((temp14 * m10 + temp17 * m14 + temp13 * m6) - (temp16 * m14 + temp12 * m6 + temp15 * m10));
        out[13] = d * ((temp20 * m14 + temp12 * m2 + temp19 * m10) - (temp18 * m10 + temp21 * m14 + temp13 * m2));
        out[14] = d * ((temp18 * m6 + temp23 * m14 + temp15 * m2) - (temp22 * m14 + temp14 * m2 + temp19 * m6));
        out[15] = d * ((temp22 * m10 + temp16 * m2 + temp21 * m6) - (temp20 * m6 + temp23 * m10 + temp17 * m2));

        return out;
    };

    var premultiplyMatrix = function (out, matrixA, matrixB) {
		
        var b0 = matrixB[0], b4 = matrixB[4], b8 = matrixB[8], b12 = matrixB[12],
            b1 = matrixB[1], b5 = matrixB[5], b9 = matrixB[9], b13 = matrixB[13],
            b2 = matrixB[2], b6 = matrixB[6], b10 = matrixB[10], b14 = matrixB[14],
            b3 = matrixB[3], b7 = matrixB[7], b11 = matrixB[11], b15 = matrixB[15],

            aX = matrixA[0], aY = matrixA[1], aZ = matrixA[2], aW = matrixA[3];
        out[0] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[1] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[2] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[3] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        aX = matrixA[4], aY = matrixA[5], aZ = matrixA[6], aW = matrixA[7];
        out[4] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[5] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[6] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[7] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        aX = matrixA[8], aY = matrixA[9], aZ = matrixA[10], aW = matrixA[11];
        out[8] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[9] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[10] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[11] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        aX = matrixA[12], aY = matrixA[13], aZ = matrixA[14], aW = matrixA[15];
        out[12] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[13] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[14] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[15] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        return out;
    };

    var makePerspectiveMatrix = function (matrix, fov, aspect, near, far) {
		
        var f = Math.tan(0.5 * (Math.PI - fov));
		var range = near - far;

        matrix[0] = f / aspect;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;
        matrix[4] = 0;
        matrix[5] = f;
        matrix[6] = 0;
        matrix[7] = 0;
        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = far / range;
        matrix[11] = -1;
        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = (near * far) / range;
        matrix[15] = 0.0;

        return matrix;
    };    

    var programWrapper = function (gl, vertexShader, fragmentShader, attributeLocations) {
		
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

    var buildShader = function (gl, type, source) {
		
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        console.log(gl.getShaderInfoLog(shader));
        return shader;
    };

    var buildTexture = function (gl, unit, format, type, width, height, data, wrapS, wrapT, minFilter, magFilter) {
		
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        return texture;
    };

    var CAMERA_DISTANCE = 20,
        ORBIT_POINT = [0.0, 0.0, 0.0],
        INITIAL_AZIMUTH = 0.4,
		MIN_AZIMUTH = -Math.PI,
        MAX_AZIMUTH = Math.PI,
        INITIAL_ELEVATION = 0.2,        
        MIN_ELEVATION = 0.01,
        MAX_ELEVATION = Math.PI;

    var Camera = function () {
		
        var azimuth = INITIAL_AZIMUTH,
            elevation = INITIAL_ELEVATION,

            viewMatrix = makeIdentityMatrix(new Float32Array(16)),
            position = new Float32Array(3),
            updated = true;

        this.changeAzimuth = function (deltaAzimuth) {
			
            azimuth += deltaAzimuth;
            azimuth = clamp(azimuth, MIN_AZIMUTH, MAX_AZIMUTH);
            updated = true;
        };

        this.changeElevation = function (deltaElevation) {
			
            elevation += deltaElevation;
            elevation = clamp(elevation, MIN_ELEVATION, MAX_ELEVATION);
            updated = true;
        };

        this.getPosition = function () {
			
            return position;
        };

        var orbitTranslationMatrix = makeIdentityMatrix(new Float32Array(16)),
            xRotationMatrix = new Float32Array(16),
            yRotationMatrix = new Float32Array(16),
            distanceTranslationMatrix = makeIdentityMatrix(new Float32Array(16));

        this.getViewMatrix = function () {
			
            if (updated) {
				
                makeIdentityMatrix(viewMatrix);

                makeXRotationMatrix(xRotationMatrix, elevation);
                makeYRotationMatrix(yRotationMatrix, azimuth);
                distanceTranslationMatrix[14] = -CAMERA_DISTANCE;
                orbitTranslationMatrix[12] = -ORBIT_POINT[0];
                orbitTranslationMatrix[13] = -ORBIT_POINT[1];
                orbitTranslationMatrix[14] = -ORBIT_POINT[2];

                premultiplyMatrix(viewMatrix, viewMatrix, orbitTranslationMatrix);
                premultiplyMatrix(viewMatrix, viewMatrix, yRotationMatrix);
                premultiplyMatrix(viewMatrix, viewMatrix, xRotationMatrix);
                premultiplyMatrix(viewMatrix, viewMatrix, distanceTranslationMatrix);

                position[0] = CAMERA_DISTANCE * Math.sin(Math.PI / 2 - elevation) * Math.sin(-azimuth) + ORBIT_POINT[0];
                position[1] = CAMERA_DISTANCE * Math.cos(Math.PI / 2 - elevation) + ORBIT_POINT[1];
                position[2] = CAMERA_DISTANCE * Math.sin(Math.PI / 2 - elevation) * Math.cos(-azimuth) + ORBIT_POINT[2];

                updated = false;
            }

            return viewMatrix;
        };
    };	

    var LINES_VERTEX_SOURCE = [
        'precision highp float;',

        'attribute vec3 a_position;',

        'uniform mat4 u_projectionMatrix;',
        'uniform mat4 u_viewMatrix;',

        'void main (void) {',

            'gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 1.0);',
        '}'
    ].join('\n');

    var LINES_FRAGMENT_SOURCE = [
        'precision highp float;',        
		
        'void main (void) {',            

            'gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);',
        '}'
    ].join('\n');
	
		
	var INITIAL_HEIGHT = 2.7178,			// 8'11" contact height for someone around 6'0"
		INITIAL_BASELINEOFFS = 0.0,			// m from the centre line		
		INITIAL_ANGLE = -3.85,				// degrees
		INITIAL_SPEED = 53.6448, 			// m/s				
		GRAVITY = -9.80665,					// m/s²		
		BALL_MASS = 0.057,					// kg
		BALL_RADIUS = 0.0335,				// 3.35cm		
		DRAG_COEFFICIENT = 0.55,			// Cd (https://www.researchgate.net/publication/313199404_The_drag_coefficient_of_tennis_balls)
		AIR_DENSITY = 1.21,					// "ρ" kg/m^3
		BALL_CROSSSECTION_AREA = 0.0034; 	// "A" ms²

	var getAirAcc = function(speed) {

		// Fd = 0.5CdρAv2				
		var Fd = 0.5 * DRAG_COEFFICIENT * AIR_DENSITY * BALL_CROSSSECTION_AREA * (speed * speed);		
		// Acc = Fd / m
		return Fd / BALL_MASS;
	};
	
	var plotPath = function() {
		
		var path = [];
		
		var position = { 
			x: -11.88,
			y: INITIAL_HEIGHT,
			z: -INITIAL_BASELINEOFFS
		};
				
		// do basic Euler stuff for now
		var t = 0;
		// bit excessive, but whatever...
		var inc_t = 0.0000001;
		
		var u_horiz = Math.cos((INITIAL_ANGLE * Math.PI) / 180.0) * INITIAL_SPEED;
		var u_vert = Math.sin((INITIAL_ANGLE * Math.PI) / 180.0) * INITIAL_SPEED;
		while (position.y > BALL_RADIUS)
		{
			path.push(position.x);
			path.push(position.y);
			path.push(position.z);
			
			// vertical component
			// ------------------			
			// Get distance travelled: s = ut + 1/2at^2
			position.y += (u_vert * inc_t) + (0.5 * GRAVITY * (inc_t * inc_t));
			// Update vertical velocity: v = u + at
			u_vert = u_vert + (GRAVITY * inc_t);
			// TODO: there is also air resistance to consider vertically but it should be negligible at this speed
						
			// horizontal component (needs to be x/z if ball not travelling directly along the x axis)
			// --------------------
			// get air resistance at this speed...
			var airAcc = -getAirAcc(u_horiz);
			// Get distance travelled: s = ut + 1/2at^2
			position.x += (u_horiz * inc_t) + (0.5 * airAcc * (inc_t * inc_t));
			// Update horizontal velocity: v = u + at
			u_horiz = u_horiz + (airAcc * inc_t);
						
			path.push(position.x);
			path.push(position.y);
			path.push(position.z);
			
			// 0.91 = net height in the centre, 1.07 = net height at post, 5.02 = z offset from centre to top of post
			// TODO: work out height of the net at this point, roughly (it sags instead of is in a straight, taut line... but the straight line will do as a rough estimate)
			if ((Math.abs(position.x) <= BALL_RADIUS) && (position.y <= (0.91 + BALL_RADIUS)))
				break;
			
			// don't keep going when we're going out of the court...
			if (position.x >= 11.88)
				break;
		}
				
		var landingDist = position.x;
		document.getElementById("landingDist").innerText = landingDist.toString() + " (m), in=" + ((landingDist > BALL_RADIUS) && (landingDist <= (6.4 + BALL_RADIUS))).toString();
		
		var finalSpeed = Math.sqrt((u_vert * u_vert) + (u_horiz * u_horiz));
		document.getElementById("landingSpeed").innerText = (finalSpeed * 2.2369).toString() + " (mph)";
		
		return path;
	};
	
	var getNetGeometry = function() {
		
		var netData = plotPath();
		
		// top net post
		netData.push(0.0);
		netData.push(0.0);
		netData.push(5.02);
		// p1
		netData.push(0.0);
		netData.push(1.07);	// net height at the post
		netData.push(5.02);
		
		// bottom net post
		netData.push(0.0);
		netData.push(0.0);
		netData.push(-5.02);
		// p1
		netData.push(0.0);
		netData.push(1.07);	// net height at the post
		netData.push(-5.02);
		
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
		
		return netData;
	};
	
	var getCourtGeometry = function() {
		
		var courtData = getNetGeometry();
		
		// centre service line
		courtData.push(-6.4);
		courtData.push(0);
		courtData.push(0);
		// p1
		courtData.push(6.4);
		courtData.push(0);
		courtData.push(0);
		
		// left service line
		courtData.push(-6.4);
		courtData.push(0);
		courtData.push(-4.11);
		// p1
		courtData.push(-6.4);
		courtData.push(0);
		courtData.push(4.11);
		
		// right service line
		courtData.push(6.4);
		courtData.push(0);
		courtData.push(-4.11);
		// p1
		courtData.push(6.4);
		courtData.push(0);
		courtData.push(4.11);
		
		// left side line
		courtData.push(-11.88); // 5.48 + 6.4
		courtData.push(0);
		courtData.push(-4.11);
		// p1
		courtData.push(11.88);
		courtData.push(0);
		courtData.push(-4.11);
		
		// right side line
		courtData.push(-11.88); // 5.48 + 6.4
		courtData.push(0);
		courtData.push(4.11);
		// p1
		courtData.push(11.88);
		courtData.push(0);
		courtData.push(4.11);
		
		// left baseline
		courtData.push(-11.88); // 5.48 + 6.4
		courtData.push(0);
		courtData.push(-4.11);
		// p1
		courtData.push(-11.88);
		courtData.push(0);
		courtData.push(4.11);
		
		// right baseline
		courtData.push(11.88); // 5.48 + 6.4
		courtData.push(0);
		courtData.push(-4.11);
		// p1
		courtData.push(11.88);
		courtData.push(0);
		courtData.push(4.11);
		
		return courtData;
	};

    var Simulator = function (canvas, width, height) {
		
        var canvas = canvas;
        canvas.width = width;
        canvas.height = height;

        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');        

        var updated = true;
		
        gl.clearColor.apply(gl, CLEAR_COLOR);
        gl.enable(gl.DEPTH_TEST);

        var linesProgram = new programWrapper(gl,
            buildShader(gl, gl.VERTEX_SHADER, LINES_VERTEX_SOURCE),
            buildShader(gl, gl.FRAGMENT_SHADER, LINES_FRAGMENT_SOURCE), {
                'a_position': 0                
			}
		);
        gl.useProgram(linesProgram.getProgram());

        gl.enableVertexAttribArray(0);        
                
		var courtData = [];
        var courtBuffer = gl.createBuffer();        		
		this.rebuildCourtData = function () {
			
			courtData = getCourtGeometry();
			if (courtBuffer)
			{
				gl.deleteBuffer(courtBuffer);
			}
			courtBuffer = gl.createBuffer();			
			gl.bindBuffer(gl.ARRAY_BUFFER, courtBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(courtData), gl.STATIC_DRAW);
		};
		this.rebuildCourtData();
		
		this.onLaunchHeightChanged = function (launchHeight) {
			
			INITIAL_HEIGHT = Number(launchHeight);
			this.rebuildCourtData();
		};
		
		this.onLaunchAngleChanged = function (launchAngleDeg) {
			
			INITIAL_ANGLE = Number(launchAngleDeg);
			this.rebuildCourtData();
		};
		
		this.onLaunchSpeedChanged = function (launchSpeedMPH) {
			
			// convert to m/s for the calculations
			INITIAL_SPEED = Number(launchSpeedMPH) / 2.23694;
			this.rebuildCourtData();
		};
			
        
        this.render = function (deltaTime, projectionMatrix, viewMatrix, cameraPosition) {
			
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);            

			// draw court lines
            gl.bindBuffer(gl.ARRAY_BUFFER, courtBuffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
			
            gl.useProgram(linesProgram.getProgram());
            gl.uniformMatrix4fv(linesProgram.getUniformLocation('u_projectionMatrix'), false, projectionMatrix);
            gl.uniformMatrix4fv(linesProgram.getUniformLocation('u_viewMatrix'), false, viewMatrix);
            gl.drawArrays(gl.LINES, 0, courtData.length / 3);
        };

    };

    var isWebGLSupported = function () {
		
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

    var requestAnimationFrame = window.requestAnimationFrame || 	
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

    var FOV = (60 / 180) * Math.PI,
        NEAR = 1,
        FAR = 10000,
        MIN_ASPECT = 16 / 9;
        
    var SENSITIVITY = 1.0;

    var SIMULATOR_CANVAS_ID = 'simulator';

    var NONE = 0,
        ORBITING = 1;

    var main = function () {
		
        var simulatorCanvas = document.getElementById(SIMULATOR_CANVAS_ID);

        var camera = new Camera();		
		var projectionMatrix = makePerspectiveMatrix(new Float32Array(16), FOV, MIN_ASPECT, NEAR, FAR);
		
		var width = simulatorCanvas.width,
            height = simulatorCanvas.height;

		simulator = new Simulator(simulatorCanvas, width, height);

        var lastMouseX = 0;
        var lastMouseY = 0;
        var mode = NONE;

        var inverseProjectionViewMatrix = [],
            nearPoint = [],
            farPoint = [];
			
        var unproject = function (viewMatrix, x, y, width, height) {
			
            premultiplyMatrix(inverseProjectionViewMatrix, viewMatrix, projectionMatrix);
            invertMatrix(inverseProjectionViewMatrix, inverseProjectionViewMatrix);

            setVector4(nearPoint, (x / width) * 2.0 - 1.0, ((height - y) / height) * 2.0 - 1.0, 1.0, 1.0);
            transformVectorByMatrix(nearPoint, nearPoint, inverseProjectionViewMatrix);

            setVector4(farPoint, (x / width) * 2.0 - 1.0, ((height - y) / height) * 2.0 - 1.0, -1.0, 1.0);
            transformVectorByMatrix(farPoint, farPoint, inverseProjectionViewMatrix);

            projectVector4(nearPoint, nearPoint);
            projectVector4(farPoint, farPoint);

            var t = -nearPoint[1] / (farPoint[1] - nearPoint[1]);
            var point = [
                nearPoint[0] + t * (farPoint[0] - nearPoint[0]),
                nearPoint[1] + t * (farPoint[1] - nearPoint[1]),
                nearPoint[2] + t * (farPoint[2] - nearPoint[2]),
            ];

            return point;
        };
		
		var getMousePosition = function (event, element) {
		
			var boundingRect = element.getBoundingClientRect();
			return {
				x: event.clientX - boundingRect.left,
				y: event.clientY - boundingRect.top
			};
		};

        simulatorCanvas.addEventListener('mousedown', function (event) {
			
            event.preventDefault();

            var mousePosition = getMousePosition(event, simulatorCanvas);
            var mouseX = mousePosition.x,
                mouseY = mousePosition.y;

            var point = unproject(camera.getViewMatrix(), mouseX, mouseY, width, height);
            
			mode = ORBITING;
			lastMouseX = mouseX;
			lastMouseY = mouseY;
        });

        simulatorCanvas.addEventListener('mousemove', function (event) {
			
            event.preventDefault();

            var mousePosition = getMousePosition(event, simulatorCanvas),
                mouseX = mousePosition.x,
                mouseY = mousePosition.y;

            var point = unproject(camera.getViewMatrix(), mouseX, mouseY, width, height);

            if (mode === ORBITING) {
				
                simulatorCanvas.style.cursor = '-webkit-grabbing';
                simulatorCanvas.style.cursor = '-moz-grabbing';
                simulatorCanvas.style.cursor = 'grabbing';
            } 
			else {
                simulatorCanvas.style.cursor = '-webkit-grab';
                simulatorCanvas.style.cursor = '-moz-grab';
                simulatorCanvas.style.cursor = 'grab';
            }

            if (mode === ORBITING) {
				
                camera.changeAzimuth((mouseX - lastMouseX) / width * SENSITIVITY);
                camera.changeElevation((mouseY - lastMouseY) / height * SENSITIVITY);
                lastMouseX = mouseX;
                lastMouseY = mouseY;
            }
        });

        simulatorCanvas.addEventListener('mouseup', function (event) {
			
            event.preventDefault();
            mode = NONE;
        });

        simulatorCanvas.addEventListener('mouseout', function (event) {
			
            var from = event.relatedTarget || event.toElement;
			mode = NONE;
        });

        var previousTime = (new Date()).getTime();
        var render = function render (currentTime) {
			
            var deltaTime = (currentTime - previousTime) / 1000.0 || 0.0;
            previousTime = currentTime;

            simulator.render(deltaTime, projectionMatrix, camera.getViewMatrix(), camera.getPosition());

            requestAnimationFrame(render);
        };
        render();
    } 

    if (isWebGLSupported()) {
        main();
    }
}());