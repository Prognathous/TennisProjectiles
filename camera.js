var Camera = function () {
	
    var MIN_CAMERA_DISTANCE = 0.1,
		MAX_CAMERA_DISTANCE = 30,
        // INITIAL_YAW = 0.4,		
        INITIAL_YAW = 4.6769353,
        // INITIAL_PITCH = 0.2,
        INITIAL_PITCH = 0.036416666666,
        MIN_PITCH = 0.001,
        MAX_PITCH = Math.PI;
		
	var updated = false;
		
    var yaw = INITIAL_YAW,
        pitch = INITIAL_PITCH,
        viewMatrix = makeIdentityMatrix(new Float32Array(16)),
        position = new Float32Array(3),
        updated = true;
		
	var COURT_CAMERA = 0,
		BALL_CAMERA = 1;
		
	var courtCameraData = {
		targetDistance: 7.2,
		yaw: yaw,
		pitch: pitch
	};
	var ballCameraData = {
		targetDistance: 0.75,
		yaw: yaw,
		pitch: pitch
	};
	
	var cameraType = COURT_CAMERA,
		cameraTarget = [ 0, 0, 0 ],
		targetDistance = courtCameraData.targetDistance;
		
	this.setCourtCamera = function () {
		
		// save data off for when returning to the ball camera
		ballCameraData.targetDistance = targetDistance;
		ballCameraData.yaw = yaw;
		ballCameraData.pitch = pitch;
		
		cameraType = COURT_CAMERA;
		cameraTarget = [ 0, 0, 0 ];
		
		targetDistance = courtCameraData.targetDistance;
		yaw = courtCameraData.yaw;
		pitch = courtCameraData.pitch;
		
		updated = true;
	};
		
	this.setBallCamera = function (ballPosition) {	
	
		// save "zoom" off for when reverting to the court camera
		courtCameraData.targetDistance = targetDistance;
		courtCameraData.yaw = yaw;
		courtCameraData.pitch = pitch;
		
		cameraType = BALL_CAMERA;
		cameraTarget = ballPosition;
		
		targetDistance = ballCameraData.targetDistance;
		yaw = ballCameraData.yaw;
		pitch = ballCameraData.pitch;
		
		updated = true;
	};
	
	this.updateTarget = function (target) {

		if ((target[0] != cameraTarget[0]) || (target[1] != cameraTarget[1]) || (target[2] != cameraTarget[2])) {
			
			cameraTarget = target;	
			updated = true;
		}
	};
		
	var clamp = function (x, min, max) {
        return Math.min(Math.max(x, min), max);
    };
	
	var epsilon = function (x) {
        return Math.abs(x) < 0.000001 ? 0 : x;
    };
		
    this.changeYaw = function (deltaYaw) {
		
        yaw += deltaYaw;
		while (yaw > (Math.PI * 2)) {
			yaw -= (Math.PI * 2);
		}        
		while (yaw < 0) {
			yaw += (Math.PI * 2);
		}
        updated = true;
    };
	
    this.changePitch = function (deltaPitch) {
		
        pitch += deltaPitch;
        pitch = clamp(pitch, MIN_PITCH, MAX_PITCH);
        updated = true;
    };		
	
    this.getPosition = function () {
		
        return position;
    };
	
	this.zoom = function (delta) {
		
		targetDistance = clamp(targetDistance + delta, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE);
		updated = true;
	};
	
    var orbitTranslationMatrix = makeIdentityMatrix(new Float32Array(16)),
        xRotationMatrix = new Float32Array(16),
        yRotationMatrix = new Float32Array(16),
        distanceTranslationMatrix = makeIdentityMatrix(new Float32Array(16));
		
    this.getViewMatrix = function () {
		
        if (updated) {
			
            makeIdentityMatrix(viewMatrix);
            makeXRotationMatrix(xRotationMatrix, pitch);
            makeYRotationMatrix(yRotationMatrix, yaw);
			
            distanceTranslationMatrix[14] = -targetDistance;
            orbitTranslationMatrix[12] = -cameraTarget[0];
            orbitTranslationMatrix[13] = -cameraTarget[1];
            orbitTranslationMatrix[14] = -cameraTarget[2];
			
            premultiplyMatrix(viewMatrix, viewMatrix, orbitTranslationMatrix);
            premultiplyMatrix(viewMatrix, viewMatrix, yRotationMatrix);
            premultiplyMatrix(viewMatrix, viewMatrix, xRotationMatrix);
            premultiplyMatrix(viewMatrix, viewMatrix, distanceTranslationMatrix);
			
            position[0] = targetDistance * Math.sin(Math.PI / 2 - pitch) * Math.sin(-yaw) + cameraTarget[0];
            position[1] = targetDistance * Math.cos(Math.PI / 2 - pitch) + cameraTarget[1];
            position[2] = targetDistance * Math.sin(Math.PI / 2 - pitch) * Math.cos(-yaw) + cameraTarget[2];
            updated = false;
        }
        return viewMatrix;
    };
};