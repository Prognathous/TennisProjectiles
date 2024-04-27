var Camera = function () {
	
	var CAMERA_DISTANCE = 20,
        ORBIT_POINT = [0.0, 0.0, 0.0],
        INITIAL_AZIMUTH = 0.4,
		MIN_AZIMUTH = -Math.PI,
        MAX_AZIMUTH = Math.PI,
        INITIAL_ELEVATION = 0.2,        
        MIN_ELEVATION = 0.01,
        MAX_ELEVATION = Math.PI;
		
	var updated = false;
		
    var azimuth = INITIAL_AZIMUTH,
        elevation = INITIAL_ELEVATION,
        viewMatrix = makeIdentityMatrix(new Float32Array(16)),
        position = new Float32Array(3),
        updated = true;
		
	var clamp = function (x, min, max) {
        return Math.min(Math.max(x, min), max);
    };
	
	var epsilon = function (x) {
        return Math.abs(x) < 0.000001 ? 0 : x;
    };	    
		
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