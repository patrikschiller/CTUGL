/**
 * Camera
 * @summary Class that represents camera and its properties
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class Camera {
    /**
     * 
     * @param {WebGlRenderingContext} gl_ 
     * @param {Vector3} position_ - World Space 
     * @param {Vector3} direction_ - Inverse of look direction
     */
    constructor(gl_, position_ = [0.0, 0.0, 0.0], direction_ = [1.0, 0.0, 1.0]){
        this.gl = gl_;

        this.position = position_;
        this.direction = direction_; //front

        this.target = [0.0, 0.0, 0.0];
        this.up = [0.0, 1.0, 0.0];

        this.yaw = 90.0; //pitch
        this.pitch = 0.0; //yaw

        this.movementDirection = direction_;

        /** @todo Add possibility to adjust these attributes */
        this.FOV = 60.0;
        this.near = 0.2;
        this.far = 100.0;

        this.Projection = null; //unit matrix
        this.View = null; //unit matrix
    }

    recalculateTarget(){
        this.target = m4.addVectors(
            //[ - this.direction[0], - this.direction[1], - this.direction[2]], 
            this.direction,
            this.position
        );
        //this.target = [0.0, 0.0, 1.0];
    }

    updateView(){
        var temp = m4.lookAt(
            this.position,
            this.target,
            this.up
        );
        this.View = m4.inverse(temp);
    }

    updateProjection(winWidth, winHeight){
        this.Projection = m4.perspective(
            this.FOV * Math.PI / 180,   // Field of View !! Radians
            winWidth / winHeight,       // Aspect ratio
            //canvas.clientWidth / canvas.clientHeight, // Aspect ratio
            this.near,                  // Near
            this.far                    // Far
        );
    }

    /**
     * @summary - Recalculates camera parameters (after camera motion, window resize, etc...)
     * @param {Integer} WINX 
     * @param {Integer} WINY 
     */
    updateCamera(WINX, WINY){
        this.updateProjection(WINX, WINY);
        this.recalculateTarget();
        this.updateView();
    }

    /**
     * @summary - Moves camera forward by delta distance
     * @param {Float} motionDelta 
     */
    moveForward(motionDelta){
        this.position = m4.addVectors(this.position, this.multiplyVecByConst(this.direction, motionDelta));
    }

    /**
     * @summary - Moves camera back by delta distance
     * @param {Float} motionDelta 
     */
    moveBackward(motionDelta){
        this.position = m4.subtractVectors(this.position, this.multiplyVecByConst(this.direction, motionDelta));
    }

    /**
     * @summary - Moves camera right by delta distance
     * @param {Float} motionDelta 
     */
    moveRight(motionDelta){
        var xAxis = m4.normalize(m4.cross(this.direction, [0.0, 1.0, 0.0]));
        this.position = m4.addVectors(this.position, this.multiplyVecByConst(xAxis, motionDelta));
    }

    /**
     * @summary - Moves camera left by delta distance
     * @param {Float} motionDelta 
     */
    moveLeft(motionDelta){
        var xAxis = m4.normalize(m4.cross(this.direction, [0.0, 1.0, 0.0]));
        this.position = m4.subtractVectors(this.position, this.multiplyVecByConst(xAxis, motionDelta));
    }

    /**
     * @summary - Moves camera down by delta distance
     * @param {Float} motionDelta 
     */
    moveDown(motionDelta){
        this.position[1] -= motionDelta;
    }

    /**
     * @summary - Moves camera up by delta distance
     * @param {Float} motionDelta 
     */
    moveUp(motionDelta){
        this.position[1] += motionDelta;
    }
    
    /**
     * @summary - Rotates the camera by mouse motion delta
     * @param {Float} deltaX 
     * @param {Float} deltaY 
     */
    rotateByMouse(deltaX, deltaY){
        this.yaw += -deltaX;
        this.pitch += deltaY;
        if(this.pitch > 89.0){this.pitch = 89.0;}
        if(this.pitch < -89.0){this.pitch = -89.0;}


        var temp_front = new Float32Array(3);
        temp_front[0] = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        temp_front[1] = Math.sin(this.pitch * Math.PI / 180);
        temp_front[2] = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        this.direction = m4.normalize(temp_front);

        var xAxis = m4.normalize(m4.cross(this.direction, [0.0, 1.0, 0.0]));
        this.up = m4.normalize(m4.cross(xAxis, this.direction));
    }

    /**
     * @summary - Multiplies vector by 4x4 matrix
     * @param {Vector4} vec 
     * @param {Matrix4} mat 
     * @returns {Vector3} - multiplied vector
     */
    multiplyVecMat(vec, mat){
        var vecOut = new Float32Array(3);

        vecOut[0] = mat[0] * vec[0] + mat[1] * vec[1] + mat[2] * vec[2] + mat[3] * vec[3];
        vecOut[1] = mat[4] * vec[0] + mat[5] * vec[1] + mat[6] * vec[2] + mat[7] * vec[3];
        vecOut[2] = mat[8] * vec[0] + mat[9] * vec[1] + mat[10] * vec[2] + mat[11] * vec[3];
        var w = mat[12] * vec[0] + mat[13] * vec[1] + mat[14] * vec[2] + mat[15] * vec[3];

        return vecOut;
    }

    /**
     * @summary - Multiplies vector by constant
     * @param {Vec3} vec 
     * @param {Float} constant 
     */
    multiplyVecByConst(vec, constant){
        var vecOut = new Float32Array(3);
        vecOut[0] = vec[0] * constant;
        vecOut[1] = vec[1] * constant;
        vecOut[2] = vec[2] * constant;

        return vecOut;
    }
}