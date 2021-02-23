/**
 * Model 
 * @summary Class that represents object structure (model) which can consist of multiple meshes
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class Model {
    /**
     * 
     * @param {String} _name  - Model name
     * @param {WebGL2RenderingContext} _gl - GL context reference
     * @param {CtuGL} _ctu_gl - CTU GL instance reference
     * @param {RenderSettings} _rs - Instance of render setting config
     */
    constructor(_name, _gl, _ctu_gl, _rs, _id = 0){
        this.name = _name;
        this.gl = _gl;
        this.ctugl = _ctu_gl;
        this.RenderSettings = _rs;
        this.ID = _id;

        this.rotate = true;
        this.reflectance = 0.0;

        this.UnitMatrix = [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ];
        this.position = [0.0, 0.0, 0.0];
        this.scale = [1.0, 1.0, 1.0];

        this.Geometry = {
            shaders : [],
            meshes : [], //[[mesh1, shaderId1], [mesh2, shaderId2]]

            Model : this.UnitMatrix
        };
        console.log("Model " + this.name + " initialized");
    }

    /**
     * https://github.com/assimp/assimp2json
     * @param {String} src 
     */
    loadAssimp(src){
        this.name = src.rootnode.name;
        src.meshes.forEach(item => {
            console.log("["+this.name+"] Loading Mesh <" + item.name + ">");
            var materialIdx = item.materialindex;
            var mesh = new Mesh(this.gl, this.Geometry.shaders[0]);

            //** Set geometry */
            mesh.vertices = item.vertices;
            mesh.normals = item.normals;
            //tangents  
            //bitangents
            //uv components
            mesh.uv = item.texturecoords ? item.texturecoords[0] : [];
            mesh.indices = item.faces.flat(1);
            var material = src.materials[materialIdx].properties;


            //** Set material */
            mesh.Material.ambient = material[2].value;
            mesh.Material.diffuse = material[3].value;
            mesh.Material.specular = material[4].value;
            mesh.Material.shininess = material[5].value;
            //opacity
            //refract

            //** Set textures */
            material.forEach((property)=>{
                if(property.key.includes("tex.file")){
                    mesh.Material.textures.push("js/data/models/textures/" + property.value);
                }
            })

            mesh.initGeometry();
            console.log(mesh);
            this.Geometry.meshes.push(mesh);
            console.log("["+this.name+"] Geometry <"+item.name+"> successfully loaded");
        });
    }

    /**
    * https://clara.io/
     * !! Y and Z axes are switched!!!
     * @param {String} src 
     */
    loadClara(src){
        for(var g_idx in src.geometries){
            console.log("["+this.name+"] Loading geometry <" + g_idx + ">");
            var geometry = src.geometries[g_idx];
            var mesh = new Mesh(this.gl, this.Geometry.shaders[0]);

            //Set material (More materails not supported yet)
            mesh.Material.ambient = geometry.materials[0].colorAmbient;
            mesh.Material.diffuse = geometry.materials[0].colorDiffuse;
            mesh.Material.specular = geometry.materials[0].colorSpecular;
            mesh.Material.shininess = geometry.materials[0].specularCoef;

            //Set vertices
            mesh.vertices = geometry.data.vertices;
            mesh.normals = geometry.data.normals;
            mesh.uv = geometry.data.uvs;
            //mesh.indices = geometry.data.skinIndices;
            mesh.indices = geometry.data.faces;

            //Animation
             // Maybe in the future....

            console.log(mesh);
            mesh.initGeometry();
            this.Geometry.meshes.push(mesh);
            console.log("["+this.name+"] Geometry <"+g_idx+"> successfully loaded");
        }
    }
    /**
     * @summary Loads model from given JSON array. Splits Geometry into Meshes
     * @param {Array} src 
     */
    loadModel(src){
        //https://www.geeksforgeeks.org/how-to-get-the-first-key-name-of-a-javascript-object/
        var entryKey = Object.keys(src)[0];
        switch(entryKey){
            case "images":
                this.loadClara(src);
                console.log("Loading Clara model");
                break;
            case "rootnode":
                this.loadAssimp(src);
                console.log("Loading Assimp model");
                break;
        }
    }

    /**
     * @summary Retrieves array from JSON file
     * @param {JSON} src_json 
     */
    loadModelFromJSON(src_json){
        //bla bla
        this.loadModel('__src');
    }

    /**
     * @summary Adds shader to stack
     * @param {Shader} shader 
     */
    addShader(shader){
        this.Geometry.shaders.push(shader);
    }

    setUniforms(Camera, shaderProgram){
        var PVM = m4.multiply(Camera.Projection, m4.multiply(Camera.View, this.Geometry.Model));
        var normalMatrix = m4.transpose(m4.inverse(this.Geometry.Model));

        var PVMlocation = this.gl.getUniformLocation(shaderProgram, "PVM");
        this.gl.uniformMatrix4fv(PVMlocation, gl.FALSE, PVM);

        var Normal_Matrix_location = this.gl.getUniformLocation(shaderProgram, "normalMatrix");
        this.gl.uniformMatrix4fv(Normal_Matrix_location, gl.FALSE, normalMatrix);

        var Camlocation = this.gl.getUniformLocation(shaderProgram, "camPos");
        this.gl.uniform3fv(Camlocation, Camera.position);

        var Model_location = this.gl.getUniformLocation(shaderProgram, "Model");
        this.gl.uniformMatrix4fv(Model_location, gl.FALSE, this.Geometry.Model);

        var Proj_location = this.gl.getUniformLocation(shaderProgram, "Proj");
        this.gl.uniformMatrix4fv(Proj_location, gl.FALSE, Camera.Projection);

        var View_location = this.gl.getUniformLocation(shaderProgram, "View");
        this.gl.uniformMatrix4fv(View_location, gl.FALSE, Camera.View);

        var useFog_location = this.gl.getUniformLocation(shaderProgram, "useFog");
        if(this.RenderSettings.useFog){
            this.gl.uniform1i(useFog_location, 1);

            var BG_Color_location = this.gl.getUniformLocation(shaderProgram, "background_color");
            this.gl.uniform4fv(BG_Color_location, this.RenderSettings.backgroundColor);
    
            var Render_Distance_location = this.gl.getUniformLocation(shaderProgram, "render_distance");
            this.gl.uniform1f(Render_Distance_location, this.RenderSettings.renderDistance);
        }else{
            this.gl.uniform1i(useFog_location, 0);
        }
    }

    setLightsUniforms(lights, shaderProgram){
        var LIGTHS = lights.length;
        var lightSizeLocation = this.gl.getUniformLocation(shaderProgram, "LIGHTS_SIZE");
        this.gl.uniform1i(lightSizeLocation, lights.length);

        //Only pointlights for now
        for(var i = 0; i < LIGTHS; i++){
            var LightPositionlocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].position");
            this.gl.uniform3fv(LightPositionlocation, lights[i].position);

            var LightAmbientlocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].ambient");
            this.gl.uniform3fv(LightAmbientlocation, lights[i].ambient);

            var LightDiffuselocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].diffuse");
            this.gl.uniform3fv(LightDiffuselocation, lights[i].diffuse);

            var LightSpecularlocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].specular");
            this.gl.uniform3fv(LightSpecularlocation, lights[i].specular);

            var ConstantPowerlocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].constantPower");
            this.gl.uniform1f(ConstantPowerlocation, lights[i].constant);

            var LinearPowerlocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].linearPower");
            this.gl.uniform1f(LinearPowerlocation, lights[i].linear);

            var QuadraticPowerlocation = this.gl.getUniformLocation(shaderProgram, "lights[" + i + "].quadraticPower");
            this.gl.uniform1f(QuadraticPowerlocation, lights[i].quadratic);
        };
    }

    update(elapsedTime){
        var zOffset = 10.0;
        var rotAngleDeg = (elapsedTime / 100) % 360;
        this.Geometry.Model = this.UnitMatrix;
        //1. Translate !!
        //this.Geometry.Model = m4.translate(this.Geometry.Model, 0.0, 0.0, zOffset);
        this.Geometry.Model = m4.translate(this.Geometry.Model, this.position[0], 0.0, 0.0);
        this.Geometry.Model = m4.translate(this.Geometry.Model, 0.0, this.position[1], 0.0);
        this.Geometry.Model = m4.translate(this.Geometry.Model, 0.0, 0.0, this.position[2]);
        //2. Rotate !!
        //this.Geometry.Model = m4.axisRotate(this.Geometry.Model, [1.0, 0.0, 0.0], 20 * Math.PI / 180);
        this.Geometry.Model = m4.axisRotate(this.Geometry.Model, [0.0, 1.0, 0.0], 20 * Math.PI / 180);
        //this.Geometry.Model = m4.axisRotate(this.Geometry.Model, [0.0, 0.0, 1.0], 0 * Math.PI / 180);
        ///this.Geometry.Model = m4.axisRotate(this.Geometry.Model, [0.0, 0.0, 1.0], rotAngleDeg * Math.PI / 180);
        if(this.rotate){
            this.Geometry.Model = m4.axisRotate(this.Geometry.Model, [0.0, 1.0, 0.0], rotAngleDeg * Math.PI / 180);
        }
        ///this.Geometry.Model = m4.axisRotate(this.Geometry.Model, [1.0, 0.0, 0.0], rotAngleDeg * Math.PI / 180);
        //3. Scale
        this.Geometry.Model = m4.scale(this.Geometry.Model, this.scale[0], this.scale[1], this.scale[2]);
    }

    /**
     * @summary Updates uniforms and performs drawing of all meshes
     * @param {Camera} Camera Reference to camera instance
     * @param {Array<Light>} lights Array with scene lights
     * @param {CubeMap} envMap Reference to CubeMap (if used) which is used for rendering Environment map reflection
     */
    draw(Camera, lights, envMap = null){
        var shader = this.Geometry.shaders[0];
        shader.use();

        this.setUniforms(Camera, shader.Program);
        this.setLightsUniforms(lights, shader.Program);

        if(this.name == "Chinesse"){
            this.gl.frontFace(this.gl.CW);
        }
        for(let idx in this.Geometry.meshes){
            this.Geometry.meshes[idx].draw(/*Camera*/envMap, this.reflectance);
        }
        if(this.name == "Chinesse"){
            this.gl.frontFace(this.gl.CCW);
        }
    }

    /**
     * @summary - Initializes geometry for all meshes of this model so it can be clickable in the scene
     * @param {Integer} _ID - Unique ID, so the model can be recognized by mouse-click
     * @param {Shader} _pickShader - Shader used for drawing into Render Buffer with model IDs
     */
    initPicking(_ID, _pickShader){
        this.ID = _ID;
        for(let idx in this.Geometry.meshes){
            this.Geometry.meshes[idx].initPicking(_pickShader);
        }
    }

    /**
     * @summary - Draws data into "Pick" Buffer = Render Buffer that stores ID of visible objects
     *          - The Pick Buffer must be bound by gl.bindFramebuffer( ... ) before invoking this method
     *          - Off-Screen render
     *          - IDs are accessible from given Render Buffer via gl.readPixels() after mouse click
     *          - The Render Buffer (That means it's parent Frame Buffer must be bound)
     * @param {Camera} camera - Reference to camera 
     * @param {Shader} pickShader - Reference to used Shader
     */
    drawPickBuffer(camera, pickShader){
        pickShader.use();

        let PVM = m4.multiply(camera.Projection, m4.multiply(camera.View, this.Geometry.Model));
        let ID_vector = [this.ID + 1, 0];
        let otherData = 0;

        /* VS uniforms */
        let PVMlocation = gl.getUniformLocation(pickShader.Program, "PVM");
        gl.uniformMatrix4fv(PVMlocation, gl.FALSE, PVM);

        /* FS uniforms */
        let IDlocation = gl.getUniformLocation(pickShader.Program, "ID");
        gl.uniform2uiv(IDlocation, ID_vector);

        let OtherDatalocation = gl.getUniformLocation(pickShader.Program, "otherData1");
        gl.uniform1ui(OtherDatalocation, otherData);

        for(idx in this.Geometry.meshes){
            this.Geometry.meshes[idx].drawPickBuffer();
        }
    }
}
