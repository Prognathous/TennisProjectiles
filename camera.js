var Camera = function () {
	
    var //CAMERA_DISTANCE = 20,
        CAMERA_DISTANCE = 7.1,
		MIN_CAMERA_DISTANCE = 0.1,
		MAX_CAMERA_DISTANCE = 30,
        ORBIT_POINT = [0.0, 0.0, 0.0],
        // INITIAL_YAW = 0.4,		
        INITIAL_YAW = 4.6769353,
        // INITIAL_PITCH = 0.2,
        INITIAL_PITCH = 0.036416666666,
        MIN_PITCH = 0.001,
        MAX_PITCH = Math.PI;
		
	var updated = false;
		
    var cameraDistance = CAMERA_DISTANCE,
		yaw = INITIAL_YAW,
        pitch = INITIAL_PITCH,
        viewMatrix = makeIdentityMatrix(new Float32Array(16)),
        position = new Float32Array(3),
        updated = true;
		
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
		
		cameraDistance = clamp(cameraDistance + delta, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE);
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
			
            distanceTranslationMatrix[14] = -cameraDistance;
            orbitTranslationMatrix[12] = -ORBIT_POINT[0];
            orbitTranslationMatrix[13] = -ORBIT_POINT[1];
            orbitTranslationMatrix[14] = -ORBIT_POINT[2];
			
            premultiplyMatrix(viewMatrix, viewMatrix, orbitTranslationMatrix);
            premultiplyMatrix(viewMatrix, viewMatrix, yRotationMatrix);
            premultiplyMatrix(viewMatrix, viewMatrix, xRotationMatrix);
            premultiplyMatrix(viewMatrix, viewMatrix, distanceTranslationMatrix);
			
            position[0] = cameraDistance * Math.sin(Math.PI / 2 - pitch) * Math.sin(-yaw) + ORBIT_POINT[0];
            position[1] = cameraDistance * Math.cos(Math.PI / 2 - pitch) + ORBIT_POINT[1];
            position[2] = cameraDistance * Math.sin(Math.PI / 2 - pitch) * Math.cos(-yaw) + ORBIT_POINT[2];
            updated = false;
        }
        return viewMatrix;
    };
};