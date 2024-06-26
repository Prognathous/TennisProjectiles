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
	DRAG_COEFFICIENT = 0.55,			// Cd 
	AIR_DENSITY = 1.21,					// "ρ" kg/m^3
	BALL_CROSSSECTION_AREA = 0.0034; 	// "A" ms²

(function () {
	
    'use strict';
	
	var SIZE_OF_FLOAT = 4;
	var CLEAR_COLOR = [0.0, 0.0, 0.2, 1.0];

    var Simulator = function (canvas, width, height) {
		
        var canvas = canvas;
        canvas.width = width;
        canvas.height = height;

        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        var simpleProgram = new programWrapper(gl,
            buildShader(gl, gl.VERTEX_SHADER, SIMPLE_VERTEX_SOURCE),
            buildShader(gl, gl.FRAGMENT_SHADER, SIMPLE_FRAGMENT_SOURCE), {
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
		var ballSpriteTexture = buildTexture(gl, window.ballSprite, gl.RGBA, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.LINEAR);
		var ballDataBuffer = gl.createBuffer(),
			ballDataArray = new Float32Array(5 * 6);
		gl.bindBuffer(gl.ARRAY_BUFFER, ballDataBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, ballDataArray, gl.DYNAMIC_DRAW);
		
		// court drawing is split into three parts: court background, lines and the net
		var courtData = getCourtGeometry(),
			courtBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, courtBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(courtData), gl.STATIC_DRAW);
		
		var linesData = getLinesGeometry(),
			linesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, linesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linesData), gl.STATIC_DRAW);
		
		var netPostData = getNetPostGeometry(),
			netPostBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, netPostBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(netPostData), gl.STATIC_DRAW);
		
		var netCordData = getNetCordGeometry(),
			netCordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, netCordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(netCordData), gl.STATIC_DRAW);
		
		var netData = getNetGeometry(),
			netBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, netBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(netData), gl.STATIC_DRAW);

		var pathTime = 0,
			plottingPath = false,
			pathData = [],
			pathBuffer = gl.createBuffer();

		// TODO: need to make this an explicit, sane upper limit
        var pathBufferData = new Float32Array(100000000);
		gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, pathBufferData, gl.DYNAMIC_DRAW);
		
		this.getAirResistance = function (speed) {
			
			// Fd = 0.5CdρAv2				
			return (0.5 * DRAG_COEFFICIENT * AIR_DENSITY * BALL_CROSSSECTION_AREA * (speed * speed));
		};		
				
		var u_horiz = 0,
			u_vert = 0,
			ballPosition = { x: 0, y: 0, z: 0 };
			
		this.getBallPosition = function () {

			return [ ballPosition.x, ballPosition.y, ballPosition.z ];
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
			
		this.updateBallPath = function (deltaTime) {			
		
			if (!plottingPath) {				
				return;
			}
								
			// do basic Euler stuff for now... time increment probably still a bit excessive, but whatever...
			var inc_t = 0.0001;
			for (var t = 0; t <= deltaTime; t += inc_t) {

				var startPosition = Object.assign({}, ballPosition);
				
				// vertical component
				// ------------------							
				var vertAirResistance = this.getAirResistance(u_vert),
					weight = GRAVITY * BALL_MASS;
				var vertAcc = (vertAirResistance + weight) / BALL_MASS;

				// Get distance travelled: s = ut + 1/2at^2
				ballPosition.y += (u_vert * inc_t) + (0.5 * vertAcc * (inc_t * inc_t));
				
				// Update vertical velocity: v = u + at
				u_vert = u_vert + (GRAVITY * inc_t);
							
				// horizontal component
				// --------------------
				var airDec = -this.getAirResistance(u_horiz) / BALL_MASS;
				// Get distance travelled: s = ut + 1/2at^2
				var horizDist = (u_horiz * inc_t) + (0.5 * airDec * (inc_t * inc_t));
				// Update horizontal velocity: v = u + at
				u_horiz = u_horiz + (airDec * inc_t);
				
				// Move the ball on the horizontal plane
				var theta = Math.atan(-(BASELINE_OFFSET + TARGET_OFFSET) / (11.88 + 6.4));
				var xdist = horizDist * Math.cos(theta);
				var zdist = horizDist * Math.sin(theta);				
				ballPosition.x += horizDist * Math.cos(theta);
				ballPosition.z += horizDist * Math.sin(theta);
				
				// build ribbon between the two points along the direction of motion
				var deltaX = ballPosition.x - startPosition.x,
					deltaZ = ballPosition.z - startPosition.z;
					
				var pathWidth = (BALL_RADIUS * 2.0) / 3.0;
				var thetaPath = Math.atan(deltaX / deltaZ);
				var offsX = pathWidth * Math.cos(thetaPath),
					offsZ = pathWidth * Math.sin(thetaPath);

				pathData.push(startPosition.x - offsX);
				pathData.push(startPosition.y);
				pathData.push(startPosition.z - offsZ);
				
				pathData.push(ballPosition.x - offsX);
				pathData.push(ballPosition.y);
				pathData.push(ballPosition.z - offsZ);
				
				pathData.push(startPosition.x + offsX);
				pathData.push(startPosition.y);
				pathData.push(startPosition.z + offsZ);
				
				
				pathData.push(ballPosition.x - offsX);
				pathData.push(ballPosition.y);
				pathData.push(ballPosition.z - offsZ);
				
				pathData.push(startPosition.x + offsX);
				pathData.push(startPosition.y);
				pathData.push(startPosition.z + offsZ);
				
				pathData.push(ballPosition.x + offsX);
				pathData.push(ballPosition.y);
				pathData.push(ballPosition.z + offsZ);

				
				// check if the ball has hit the net...
				if ((ballPosition.x >= 0) && (ballPosition.x <= BALL_RADIUS)) {
					
					var netHeight = getNetHeight(ballPosition.z);
					if (ballPosition.y <= (netHeight + BALL_RADIUS)) {
						
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
					(ballPosition.x >= (11.88 + BALL_RADIUS)))		// ball has gone far too far
				{
					// the ball has to have gone appreciably past the net on landing and be no further than the service line;
					var ballIsIn = (ballPosition.x > BALL_RADIUS) &&
						(ballPosition.x <= (6.4 + BALL_RADIUS)) &&
						(ballPosition.z <= BALL_RADIUS) &&
						(ballPosition.z >= -(4.11 + BALL_RADIUS));

					var landingDist = ballPosition.x;
					document.getElementById("landingDist").innerText = landingDist.toString() + " (m), in=" + ballIsIn.toString();

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
        
        this.render = function (deltaTime, projectionMatrix, viewMatrix) {

			gl.clearColor.apply(gl, CLEAR_COLOR);
			gl.enableVertexAttribArray(0);			

            gl.viewport(0, 0, canvas.width, canvas.height);
			gl.disable(gl.DEPTH_TEST); // lines very much overlay the court
			gl.disable(gl.CULL_FACE);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
			var modelMatrix = makeIdentityMatrix(new Float32Array(16))
			makeIdentityMatrix(modelMatrix);
			
			// draw triangles
			gl.useProgram(simpleProgram.getProgram());			
			gl.uniformMatrix4fv(simpleProgram.getUniformLocation('u_projectionMatrix'), false, projectionMatrix);
            gl.uniformMatrix4fv(simpleProgram.getUniformLocation('u_viewMatrix'), false, viewMatrix);
			gl.uniformMatrix4fv(simpleProgram.getUniformLocation('u_modelMatrix'), false, modelMatrix);
			
			// draw court background
			// ---------------------
			gl.uniform4f(simpleProgram.getUniformLocation('u_colour'), 0.2, 0.8, 0.2, 1.0);
			gl.bindBuffer(gl.ARRAY_BUFFER, courtBuffer);            
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
            gl.drawArrays(gl.TRIANGLES, 0, courtData.length / 3);

			// draw court lines
			// ----------------
			gl.uniform4f(simpleProgram.getUniformLocation('u_colour'), 0.9, 0.9, 0.9, 1.0);
			gl.bindBuffer(gl.ARRAY_BUFFER, linesBuffer);            
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
            gl.drawArrays(gl.TRIANGLES, 0, linesData.length / 3);
			
			
			gl.enable(gl.DEPTH_TEST);
			
			// draw net cord
			// -------------
			gl.uniform4f(simpleProgram.getUniformLocation('u_colour'), 0.9, 0.9, 0.9, 1.0);
			gl.bindBuffer(gl.ARRAY_BUFFER, netCordBuffer);            
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
            gl.drawArrays(gl.TRIANGLES, 0, netCordData.length / 3);
			
			// draw ball path
			// --------------
			gl.uniform4f(simpleProgram.getUniformLocation('u_colour'), 0.75, 0.75, 0.1, 1.0);
			gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
			gl.drawArrays(gl.TRIANGLES, 0, pathData.length / 3);
			
			// draw net posts
			// --------------
			gl.uniform4f(simpleProgram.getUniformLocation('u_colour'), 0.7, 0.3, 0.3, 1.0);
			modelMatrix[14] = -5.02;
			gl.uniformMatrix4fv(simpleProgram.getUniformLocation('u_modelMatrix'), false, modelMatrix);
			gl.bindBuffer(gl.ARRAY_BUFFER, netPostBuffer);            
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
            gl.drawArrays(gl.TRIANGLES, 0, netPostData.length / 3);
			
			modelMatrix[14] = 5.02;
			gl.uniformMatrix4fv(simpleProgram.getUniformLocation('u_modelMatrix'), false, modelMatrix);
			gl.drawArrays(gl.TRIANGLES, 0, netPostData.length / 3);			
						
			
			// draw court lines
			// ----------------
			modelMatrix[14] = 0;
			// sort the lines against the court...			
            gl.useProgram(simpleProgram.getProgram());
			gl.uniformMatrix4fv(simpleProgram.getUniformLocation('u_modelMatrix'), false, modelMatrix);
			
			// draw court net
			// --------------
			gl.uniform4f(simpleProgram.getUniformLocation('u_colour'), 0.0, 0.0, 0.0, 0.6);
			gl.bindBuffer(gl.ARRAY_BUFFER, netBuffer);            
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * SIZE_OF_FLOAT, 0);
            gl.drawArrays(gl.LINES, 0, netData.length / 3);			
			
			// draw ball sprite
			// ----------------
			gl.useProgram(spriteProgram.getProgram());
			gl.uniformMatrix4fv(spriteProgram.getUniformLocation('u_projectionMatrix'), false, projectionMatrix);
            gl.uniformMatrix4fv(spriteProgram.getUniformLocation('u_viewMatrix'), false, viewMatrix);
			gl.uniform1i(spriteProgram.getUniformLocation('u_spriteMap'), 0);
						
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, ballSpriteTexture);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
							
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
			ballData.push(0.0);
			ballData.push(1.0);
			
			ballData.push(ballPosition.x + tr[0]);
			ballData.push(ballPosition.y + tr[1]);
			ballData.push(ballPosition.z + tr[2]);
			ballData.push(1.0);
			ballData.push(1.0);
			
			ballData.push(ballPosition.x + bl[0]);
			ballData.push(ballPosition.y + bl[1]);
			ballData.push(ballPosition.z + bl[2]);
			ballData.push(0.0);
			ballData.push(0.0);
						
			// tri 1
			ballData.push(ballPosition.x + tr[0]);
			ballData.push(ballPosition.y + tr[1]);
			ballData.push(ballPosition.z + tr[2]);
			ballData.push(1.0);
			ballData.push(1.0);
			
			ballData.push(ballPosition.x + bl[0]);
			ballData.push(ballPosition.y + bl[1]);
			ballData.push(ballPosition.z + bl[2]);
			ballData.push(0.0);
			ballData.push(0.0);
			
			ballData.push(ballPosition.x + br[0]);
			ballData.push(ballPosition.y + br[1]);
			ballData.push(ballPosition.z + br[2]);
			ballData.push(1.0);
			ballData.push(0.0);
			
			gl.enableVertexAttribArray(0);
			gl.enableVertexAttribArray(1);
						
			gl.bindBuffer(gl.ARRAY_BUFFER, ballDataBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(ballData));
			gl.vertexAttribPointer(gl.getAttribLocation(spriteProgram.getProgram(), 'a_position'), 3, gl.FLOAT, false, 5 * SIZE_OF_FLOAT, 0);
			gl.vertexAttribPointer(gl.getAttribLocation(spriteProgram.getProgram(), 'a_texCoord'), 2, gl.FLOAT, false, 5 * SIZE_OF_FLOAT, 3 * SIZE_OF_FLOAT);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			
			gl.disableVertexAttribArray(0);
			gl.disableVertexAttribArray(1);
			gl.disable(gl.BLEND);
        }
    };    

    var requestAnimationFrame = window.requestAnimationFrame || 	
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame || window.msRequestAnimationFrame;    

	// camera handling
    var NONE = 0,
        ORBITING = 1,
		PANNING = 2;
	var MOUSE_SENSITIVITY = 1.0;	
	
    var main = function () {
		
        var simulatorCanvas = document.getElementById("simulator");

        var camera = new Camera();
		
		var FOV = (60 / 180) * Math.PI,
			NEAR = 0.1,
			FAR = 100,
			ASPECT_RATIO = simulatorCanvas.width / simulatorCanvas.height;
		var projectionMatrix = makePerspectiveMatrix(new Float32Array(16), FOV, ASPECT_RATIO, NEAR, FAR);
		
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
		
		var resetCamera = function () {
			
			camera.reset();
		};

        simulatorCanvas.addEventListener('mousedown', function (event) {
			
            event.preventDefault();
			
			switch (event.button) {
				case 0: 
					mode = ORBITING; 
					simulatorCanvas.style.cursor = 'grabbing';
					break;
				case 1: 
					mode = PANNING; 
					simulatorCanvas.style.cursor = 'all-scroll';
					break;
				default: 
				return;
			}
			
            var mousePosition = getMousePosition(event, simulatorCanvas);
            var mouseX = mousePosition.x,
                mouseY = mousePosition.y;
			
            var point = unproject(camera.getViewMatrix(), mouseX, mouseY, width, height);
			lastMouseX = mouseX;
			lastMouseY = mouseY;
        });

        simulatorCanvas.addEventListener('mousemove', function (event) {
			
            event.preventDefault();

            var mousePosition = getMousePosition(event, simulatorCanvas),
                mouseX = mousePosition.x,
                mouseY = mousePosition.y;
			
            var point = unproject(camera.getViewMatrix(), mouseX, mouseY, width, height);

            if (mode === NONE) {

                simulatorCanvas.style.cursor = 'grab';
            }

            if (mode === ORBITING) {
				
                camera.changeYaw((mouseX - lastMouseX) / width * MOUSE_SENSITIVITY);
                camera.changePitch((mouseY - lastMouseY) / height * MOUSE_SENSITIVITY);
                lastMouseX = mouseX;
                lastMouseY = mouseY;
            }
			if (mode === PANNING) {
								
				camera.pan(-(mouseX - lastMouseX) / width * MOUSE_SENSITIVITY, (mouseY - lastMouseY) / height * MOUSE_SENSITIVITY);
				
				lastMouseX = mouseX;
                lastMouseY = mouseY;
			}
        });

        simulatorCanvas.addEventListener('mouseup', function (event) {
			
            event.preventDefault();
            mode = NONE;
        });

        simulatorCanvas.addEventListener('mouseout', function (event) {
            
			mode = NONE;
        });
		
		simulatorCanvas.addEventListener('wheel', function (event) {

			event.preventDefault();
			switch (event.deltaMode) {
				
				case event.DOM_DELTA_PIXEL:
					camera.zoom(event.deltaY * 0.005);
				break;
				case event.DOM_DELTA_LINE:
					camera.zoom(event.deltaY * 0.05);
				break;
				case event.DOM_DELTA_PAGE:
				default:
					console.log("Unhandled mouse wheel event");
				break;
			}
		});
		
		var ballCameraSelectEl = document.getElementById('ballCameraSelect');
		ballCameraSelectEl.addEventListener('change', function () {
			
			if (ballCameraSelectEl.checked) {
				camera.setBallCamera(simulator.getBallPosition());
			}
			else {
				camera.setCourtCamera();
			}
		});
		
		var resetCameraEl = document.getElementById('resetCamera');
		resetCameraEl.addEventListener('click', function () {
			
			camera.reset();
		});

        var previousTime = (new Date()).getTime();
        var render = function render (currentTime) {
			
            var deltaTime = (currentTime - previousTime) / 1000.0 || 0.0;
            previousTime = currentTime;
						
			simulator.updateBallPath(deltaTime / 2);
		
			if (ballCameraSelectEl.checked) {
				camera.updateTarget(simulator.getBallPosition());
			}
			
            simulator.render(deltaTime, projectionMatrix, camera.getViewMatrix());

            requestAnimationFrame(render);
        };
        render();
    } 

    if (isWebGLSupported()) {
        main();
    }
}());