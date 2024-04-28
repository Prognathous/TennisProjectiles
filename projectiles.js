var simulator;

// TODO: Want a better location for these but it does mean the main html file can access them easily
var INITIAL_HEIGHT = 2.7178,			// 8'11" contact height for someone around 6'0"
	INITIAL_ANGLE = -4.8,				// degrees
	INITIAL_SPEED = 53.6448, 			// m/s
	BASELINE_OFFSET = 0.0,				// m from the centre line
	TARGET_OFFSET = 0.0,				// m from the centre line
	GRAVITY = -9.80665,					// m/s²
	BALL_MASS = 0.057,					// kg
	BALL_RADIUS = 0.0335,				// 3.35cm
	DRAG_COEFFICIENT = 0.55,			// Cd (https://www.researchgate.net/publication/313199404_The_drag_coefficient_of_tennis_balls)
	AIR_DENSITY = 1.21,					// "ρ" kg/m^3
	BALL_CROSSSECTION_AREA = 0.0034; 	// "A" ms²

(function () {
	
    'use strict';
	
	var SIZE_OF_FLOAT = 4;
	var CLEAR_COLOR = [0.9, 0.9, 0.9, 1.0];

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
        return shader;
    };

    var buildTexture = function (gl, url, unit, internalFormat, wrapS, wrapT, minFilter, magFilter) {
		
		var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
		
		var srcFormat = gl.RGBA;
		var srcType = gl.UNSIGNED_BYTE;
		
		const image = new Image();
		image.crossOrigin = "anonymous";
		
		image.onload = () => {
			
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0,	internalFormat,	srcFormat, srcType, image);
				
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
		};
		image.src = url;
		
        return texture;
    };    
	
	var SPRITE_VERTEX_SOURCE = [
		'precision highp float;',

        'attribute vec3 a_position;',
		'attribute vec2 a_texCoord;',

        'uniform mat4 u_projectionMatrix;',
        'uniform mat4 u_viewMatrix;',
		
		'varying vec2 v_texCoord;',

        'void main (void) {',

			'v_texCoord = a_texCoord;',
            'gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 1.0);',
        '}'
    ].join('\n');
	
	var SPRITE_FRAGMENT_SOURCE = [
        'precision highp float;',        
		
		'varying vec2 v_texCoord;',
		
		'uniform sampler2D u_spriteMap;',
		
        'void main (void) {',      

			'gl_FragColor = texture2D(u_spriteMap, v_texCoord).rgba;',            
        '}'
    ].join('\n');

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
	
	var getNetGeometry = function() {
		
		var netData = [];
		
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

        var linesProgram = new programWrapper(gl,
            buildShader(gl, gl.VERTEX_SHADER, LINES_VERTEX_SOURCE),
            buildShader(gl, gl.FRAGMENT_SHADER, LINES_FRAGMENT_SOURCE), {
                'a_position': 0                
			}
		);
		
		var spriteProgram = new programWrapper(gl,
            buildShader(gl, gl.VERTEX_SHADER, SPRITE_VERTEX_SOURCE),
            buildShader(gl, gl.FRAGMENT_SHADER, SPRITE_FRAGMENT_SOURCE), {
                'a_position': 0,
				'a_texCoord': 1
			}
		);
		var ballSpriteTexture = buildTexture(gl, "./BallSprite.png", 0, gl.RGBA, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		var ballDataBuffer = gl.createBuffer(),
			ballDataArray = new Float32Array(5 * 6);
		gl.bindBuffer(gl.ARRAY_BUFFER, ballDataBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, ballDataArray, gl.DYNAMIC_DRAW);

		var courtData = getCourtGeometry(),
			courtBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, courtBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(courtData), gl.STATIC_DRAW);
			
		var pathTime = 0,
			plottingPath = false,
			pathData = [],
			pathBuffer = gl.createBuffer();

		// TODO: need to make this an explicit upper limit (ridiculous amount atm!)
        var pathBufferData = new Float32Array(100000000);
		gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, pathBufferData, gl.DYNAMIC_DRAW);		
	
		this.getAirAcc = function (speed) {
	
			// Fd = 0.5CdρAv2				
			var Fd = 0.5 * DRAG_COEFFICIENT * AIR_DENSITY * BALL_CROSSSECTION_AREA * (speed * speed);		
			// Acc = Fd / m
			return Fd / BALL_MASS;
		};
		
		this.getNetHeight = function (zOffs) {
			
			// 0.91 = net height in the centre, 1.07 = net height at post, 5.02
			var tanTheta = (1.07 - 0.91) / 5.02;
			// the net sags instead of is in a straight, taut line... but the straight line will do as a rough estimate for now
			return 0.91 + (zOffs * tanTheta);
		};
				
		var u_horiz = 0,
			u_vert = 0,
			ballPosition = { x: 0, y: 0, z: 0 };
		this.updateBallPath = function (deltaTime) {			
								
			// do basic Euler stuff for now... time increment probably still a bit excessive, but whatever...
			var inc_t = 0.0001;
			for (var t = 0; t <= deltaTime; t += inc_t)
			{
				pathData.push(ballPosition.x);
				pathData.push(ballPosition.y);
				pathData.push(ballPosition.z);
				
				// vertical component
				// ------------------			
				// Get distance travelled: s = ut + 1/2at^2
				ballPosition.y += (u_vert * inc_t) + (0.5 * GRAVITY * (inc_t * inc_t));
				// Update vertical velocity: v = u + at
				u_vert = u_vert + (GRAVITY * inc_t);
				// TODO: there is also air resistance to consider vertically but it should be negligible at this speed
							
				// horizontal component (needs to be x/z if ball not travelling directly along the x axis)
				// --------------------
				// get air resistance at this speed...
				var airAcc = -this.getAirAcc(u_horiz);
				// Get distance travelled: s = ut + 1/2at^2
				var horizDist = (u_horiz * inc_t) + (0.5 * airAcc * (inc_t * inc_t));
				// Update horizontal velocity: v = u + at
				u_horiz = u_horiz + (airAcc * inc_t);
				
				var theta = Math.atan(-(BASELINE_OFFSET + TARGET_OFFSET) / (11.88 + 6.4));
				var xdist = horizDist * Math.cos(theta);
				var zdist = horizDist * Math.sin(theta);
				// move the ball on the horizontal plane
				ballPosition.x += horizDist * Math.cos(theta);
				ballPosition.z += horizDist * Math.sin(theta);
							
				pathData.push(ballPosition.x);
				pathData.push(ballPosition.y);
				pathData.push(ballPosition.z);
				
				if ((ballPosition.x >= 0) && (ballPosition.x <= BALL_RADIUS)) {
					
					var netHeight = this.getNetHeight(ballPosition.z);
					if (ballPosition.y <= (this.getNetHeight(ballPosition.z) + BALL_RADIUS)) {
						
						plottingPath = false;
						break;
					}
					else {
						
						var clearanceEl = document.getElementById("netClearance");
						if (clearanceEl.innerText == "") {
							clearanceEl.innerText = (ballPosition.y - BALL_RADIUS - netHeight).toString() + " (m)";
						}
					}
				}
				
				// check for path end...
				if ((ballPosition.y <= BALL_RADIUS) ||																					// ball has hit the ground
					(ballPosition.x >= (11.88 + BALL_RADIUS)))		// ball has gone past the baseline ball has hit the net					
				{
					var landingDist = ballPosition.x;
					document.getElementById("landingDist").innerText = landingDist.toString() + " (m), in=" + ((landingDist > BALL_RADIUS) && (landingDist <= (6.4 + BALL_RADIUS))).toString();

					var finalSpeed = Math.sqrt((u_vert * u_vert) + (u_horiz * u_horiz));
					document.getElementById("landingSpeed").innerText = (finalSpeed * 2.2369).toString() + " (mph)";
					
					plottingPath = false;
					break;
				}
			}
			
			// update the render data
			var pathDataArray = new Float32Array(pathData);
			gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, pathDataArray);
		};
		
		this.startBallPath = function() {
			
			ballPosition = { 
				x: -11.88,
				y: INITIAL_HEIGHT,
				z: BASELINE_OFFSET
			};
			
			var horizFactor = Math.cos((INITIAL_ANGLE * Math.PI) / 180.0);
			var vertFactor = Math.sin((INITIAL_ANGLE * Math.PI) / 180.0);
			u_horiz = horizFactor * INITIAL_SPEED;
			u_vert = vertFactor * INITIAL_SPEED;
			
			var startSpeed = Math.sqrt((u_vert * u_vert) + (u_horiz * u_horiz));
			
			pathTime = 0;
			plottingPath = true;
			pathData = [];
			
			document.getElementById("landingDist").innerText = "";
			document.getElementById("netClearance").innerText = "";			
			document.getElementById("landingSpeed").innerText = "";
		};
		
		this.onLaunchHeightChanged = function (launchHeight) {
			
			INITIAL_HEIGHT = Number(launchHeight);
			this.startBallPath();
		};
		
		this.onLaunchAngleChanged = function (launchAngleDeg) {
			
			INITIAL_ANGLE = Number(launchAngleDeg);
			this.startBallPath();
		};
		
		this.onLaunchSpeedChanged = function (launchSpeedMPH) {
			
			// convert to m/s for the calculations
			INITIAL_SPEED = Number(launchSpeedMPH) / 2.23694;
			this.startBallPath();
		};
		
		this.onBaselineOffsetChanged = function (baselineOffset) {
			
			BASELINE_OFFSET = Number(baselineOffset);
			this.startBallPath();
		};
			
		this.onTargetOffsetChanged = function (targetOffset) {
			
			TARGET_OFFSET = Number(targetOffset);
			this.startBallPath();
		};
        
        this.render = function (deltaTime, projectionMatrix, viewMatrix, cameraPosition) {

			gl.clearColor.apply(gl, CLEAR_COLOR);
			gl.enableVertexAttribArray(0);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);            

			// draw court lines            			
			// ----------------
            gl.useProgram(linesProgram.getProgram());
            gl.uniformMatrix4fv(linesProgram.getUniformLocation('u_projectionMatrix'), false, projectionMatrix);
            gl.uniformMatrix4fv(linesProgram.getUniformLocation('u_viewMatrix'), false, viewMatrix);			

			gl.bindBuffer(gl.ARRAY_BUFFER, courtBuffer);            
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
            gl.drawArrays(gl.LINES, 0, courtData.length / 3);

			// draw ball path
			// --------------
			if (plottingPath) {
				this.updateBallPath(deltaTime / 2);
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
			gl.drawArrays(gl.LINES, 0, pathData.length / 3);
			
			
			// draw ball sprite
			// ----------------
			gl.useProgram(spriteProgram.getProgram());
			gl.uniformMatrix4fv(spriteProgram.getUniformLocation('u_projectionMatrix'), false, projectionMatrix);
            gl.uniformMatrix4fv(spriteProgram.getUniformLocation('u_viewMatrix'), false, viewMatrix);
			gl.uniform1i(spriteProgram.getUniformLocation('u_spriteMap'), 0);
			
			// gl.enable(gl.TEXTURE_2D);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, ballSpriteTexture);
			gl.enable(gl.BLEND);
							
			var inverseView = [];
			invertMatrix (inverseView, viewMatrix);
			// no translation for this...
			inverseView[12] = 0;
            inverseView[13] = 0;
            inverseView[14] = 0;
			inverseView[15] = 1;
			
			var tl = [], 
				tr = [], 
				bl = [], 
				br = [];
			transformVectorByMatrix(tl, [ -BALL_RADIUS, -BALL_RADIUS, 0, 1 ], inverseView);
			transformVectorByMatrix(tr, [  BALL_RADIUS, -BALL_RADIUS, 0, 1 ], inverseView);
			transformVectorByMatrix(bl, [ -BALL_RADIUS,  BALL_RADIUS, 0, 1 ], inverseView);
			transformVectorByMatrix(br, [  BALL_RADIUS,  BALL_RADIUS, 0, 1 ], inverseView);
			
			var ballData = [];			
			// tri 0
			ballData.push(ballPosition.x + tl[0]);
			ballData.push(ballPosition.y + tl[1]);
			ballData.push(ballPosition.z + tl[2]);
			ballData.push(0);
			ballData.push(0);
			
			ballData.push(ballPosition.x + tr[0]);
			ballData.push(ballPosition.y + tr[1]);
			ballData.push(ballPosition.z + tr[2]);
			ballData.push(1);
			ballData.push(0);
			
			ballData.push(ballPosition.x + bl[0]);
			ballData.push(ballPosition.y + bl[1]);
			ballData.push(ballPosition.z + bl[2]);
			ballData.push(0);
			ballData.push(1);
						
			// tri 1
			ballData.push(ballPosition.x + tr[0]);
			ballData.push(ballPosition.y + tr[1]);
			ballData.push(ballPosition.z + tr[2]);
			ballData.push(1);
			ballData.push(0);
			
			ballData.push(ballPosition.x + bl[0]);
			ballData.push(ballPosition.y + bl[1]);
			ballData.push(ballPosition.z + bl[2]);
			ballData.push(0);
			ballData.push(1);
			
			ballData.push(ballPosition.x + br[0]);
			ballData.push(ballPosition.y + br[1]);
			ballData.push(ballPosition.z + br[2]);
			ballData.push(1);
			ballData.push(1);
						
			gl.bindBuffer(gl.ARRAY_BUFFER, ballDataBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(ballData));			
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * SIZE_OF_FLOAT, 0);
			gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * SIZE_OF_FLOAT, 3 * SIZE_OF_FLOAT);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
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
        
    var SENSITIVITY = 1.0;    

    var NONE = 0,
        ORBITING = 1;

    var main = function () {
		
        var simulatorCanvas = document.getElementById("simulator");

        var camera = new Camera();		
		
		var FOV = (60 / 180) * Math.PI,
			NEAR = 1,
			FAR = 10000,
			MIN_ASPECT = 16 / 9;
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
				
                camera.changeYaw((mouseX - lastMouseX) / width * SENSITIVITY);
                camera.changePitch((mouseY - lastMouseY) / height * SENSITIVITY);
                lastMouseX = mouseX;
                lastMouseY = mouseY;
            }
        });

        simulatorCanvas.addEventListener('mouseup', function (event) {
			
            event.preventDefault();
            mode = NONE;
        });

        simulatorCanvas.addEventListener('mouseout', function (event) {
			
            // var from = event.relatedTarget || event.toElement;
			mode = NONE;
        });
		
		simulatorCanvas.addEventListener('wheel', function (event) {

			event.preventDefault();
			switch (event.deltaMode) {
				
				case event.DOM_DELTA_PIXEL:
					camera.zoom(event.deltaY * 0.01);
				break;
				case event.DOM_DELTA_LINE:
					camera.zoom(event.deltaY * 0.1);
				break;
				case event.DOM_DELTA_PAGE:
				default:
					console.log("Unhandled mouse wheel event");
				break;
			}
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