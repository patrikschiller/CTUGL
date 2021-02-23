/**
 * Light
 * @summary Class that represents general light.
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class Light{
    /**
     * @param {Vector<Float>[3]} _position 
     * @param {Vector<Float>[3]} _ambient 
     * @param {Vector<Float>[3]} _diffuse 
     * @param {Vector<Float>[3]} _specular 
     * @param {Float} _constant 
     * @param {Float} _linear 
     * @param {Float} _quadratic 
     */
    constructor(_position, _ambient, _diffuse, _specular, _constant = 1.0, _linear = 0.29, _quadratic = 0.032){
        this.position = _position;
        this.ambient = _ambient;
        this.diffuse = _diffuse;
        this.specular = _specular;
        this.constant = _constant;
        this.linear = _linear;
        this.quadratic = _quadratic;

        this.reflector = null;
        this.directional = null;
        this.direction = null;

        this.mesh = null;
        this.gl = null;

        this.UnitMatrix = [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ];
    }

    /**
     * @summary Transforms default pointlight into reflector
     * @param {Float} lightCutoff 
     * @param {Float} lightOuterCutoff 
     */
    makeReflector(lightCutoff, lightOuterCutoff){
        this.reflector = {
            cutoff : lightCutoff,
            outerCutoff : lightOuterCutoff
        };
    }
    /**
     * @summary Transforms default pointlight into directional Light (global uniform illumination)
     */
    makeDirectional(){
        this.directional = true;
        this.constant = null;
        this.linear = null;
        this.quadratic = null;
    }

    /** Light source visualization using auxiliary geometry */
    /**
     * @todo 
     * @param {WebGLRenderingContext} gl 
     * @param {Shader} shader 
     * @param {Vector3} color
     * @param {Array<Float>} vertices - NOT USED
     */
    initGeometry(gl, shader, color, vertices = null){
        this.gl = gl;
        var mesh = new Mesh(gl, shader);
        mesh.Material.ambient = color;
        mesh.Material.diffuse = [0.0, 0.0, 0.0];
        mesh.Material.specular = [0.0, 0.0, 0.0];
        mesh.initGeometry("light");
        this.mesh = mesh;
    }
    /**
     * @summary - Sets uniforms to draw light geometry
     */
    setUniforms(Camera, shaderProgram){
        /* Temporary solution.. new shader needed */
        var Model = m4.translate(this.UnitMatrix, this.position[0], 0.0, 0.0);
        Model = m4.translate(Model, 0.0, this.position[1], 0.0);
        Model = m4.translate(Model, 0.0, 0.0, this.position[2]);
        Model = m4.scale(Model, 0.5, 0.5, 0.5);

        var PVM = m4.multiply(Camera.Projection, m4.multiply(Camera.View, Model));

        var PVMlocation = this.gl.getUniformLocation(shaderProgram, "PVM");
        this.gl.uniformMatrix4fv(PVMlocation, gl.FALSE, PVM);

        var Camlocation = this.gl.getUniformLocation(shaderProgram, "camPos");
        this.gl.uniform3fv(Camlocation, Camera.position);

        var Model_location = this.gl.getUniformLocation(shaderProgram, "Model");
        this.gl.uniformMatrix4fv(Model_location, gl.FALSE, Model);

        var Proj_location = this.gl.getUniformLocation(shaderProgram, "Proj");
        this.gl.uniformMatrix4fv(Proj_location, gl.FALSE, Camera.Projection);

        var lightSizeLocation = this.gl.getUniformLocation(shaderProgram, "LIGHTS_SIZE");
        this.gl.uniform1i(lightSizeLocation, 1);

        var LightAmbientlocation = this.gl.getUniformLocation(shaderProgram, "lights[0].ambient");
        this.gl.uniform3fv(LightAmbientlocation, [1.0, 1.0, 1.0]);
    }

    /**
     * @summary - Draws the lights geometry
     * @param {Camera} camera 
     */
    draw(camera){
        this.setUniforms(camera, this.mesh.Shader.Program);
        this.mesh.draw();
    }
}