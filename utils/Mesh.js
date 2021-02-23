/**
 * Mesh
 * @summary Class that represents one mesh and its geometry
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class Mesh {
    constructor(gl_, shader_){
        this.gl = gl_;
        this.Material = { //Array in the future -UNIFORM
            ambient : [],
            diffuse : [],
            specular : [],
            shininess : 0,
            textures : [],
            texSamplers : []
        };
        this.vertices = [];
        this.normals = [];
        this.uv = [];
        this.indices = [];

        this.VAO = null;
        this.VBO = null;
        this.EBO = null;

        this.VAO_Pick = null;

        this.Shader = shader_;
    }

    /**
     * @summary Initializes geometry, buffers, etc...
     * @param {String} type - optional parameter which describes type of given geometry (lightSource, classic object, etc.)
     */
    initGeometry(type = null){
        //Setup VAO
        this.VAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.VAO);
        if(this.VAO){
            console.log("[MESH] VAO init successful")
        }else{
            console.error("[MESH] VAO initialization Error");
        }

        // === < FOR TESTING PURPOSES >

        var TEMP_VERTICES = [
            0,0,0,
            1,0,0,
            1,1,0,
            0,1,0,
            0,0,1,
            1,0,1,
            1,1,1,
            0,1,1,
        ];

        var TEMP_NORMALS = [
            0,0,0,
            1,0,0,
            1,1,0,
            0,1,0,
            0,0,1,
            1,0,1,
            1,1,1,
            0,1,1,
        ];
        
        var TEMP_INDICES = [
            0,1,2,
            2,3,0,
            1,5,6,
            6,2,1,
            5,4,7,
            7,6,5,
            4,0,3,
            3,7,4,
            4,5,1,
            1,0,4,
            3,2,6,
            6,7,3,
        ];
        // === </ FOR TESTING PURPOSES >

        if(type == "light"){
            this.vertices = TEMP_VERTICES;
            this.indices = TEMP_INDICES;
            this.normals = TEMP_NORMALS;
        }

        //Prepare data for VBO
        var verticesStart = 0;
        var normalsStart = this.vertices.length;
        var uvsStart = this.vertices.length + this.normals.length;
        var data = [];


        let data_ = this.vertices.concat(this.normals);
        data = data_.concat(this.uv);

        console.log("Data here");
        console.log(data);

        //Setup VBO
        this.VBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        if(this.VBO){
            console.log("[MESH] VBO init successful")
        }else{
            console.error("[MESH] VBO initialization Error");
        }

        //Setup pointers and attributes
        var posLocation = this.gl.getAttribLocation(this.Shader.Program, "position");
        var normalLocation = this.gl.getAttribLocation(this.Shader.Program, "normal");
        if(this.Material.textures.length > 0){
            var texLocation = this.gl.getAttribLocation(this.Shader.Program, "texCoord");
        }

        //https://stackoverflow.com/questions/17313685/webgl-enablevertexattribarray-index-out-of-range
        if(posLocation > -1){
            console.log("Vertex coords: " + posLocation);
            console.log("Vertex coords start at: " + verticesStart);
            this.gl.enableVertexAttribArray(posLocation);
            this.gl.vertexAttribPointer(posLocation, 3, this.gl.FLOAT, false, 3 * 4, verticesStart);
        }
        
        //https://stackoverflow.com/questions/17313685/webgl-enablevertexattribarray-index-out-of-range
        if(normalLocation > -1){
            console.log("Normal coords: " + normalLocation);
            console.log("Normal coords start at: " + normalsStart);
            this.gl.enableVertexAttribArray(normalLocation);
            this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 3 * 4, normalsStart * 4);    
        }

        if(texLocation > -1){
            console.log("Tex coords start at: " + uvsStart);
            this.gl.enableVertexAttribArray(texLocation);
            this.gl.vertexAttribPointer(texLocation, 2, this.gl.FLOAT, false, 2 * 4, uvsStart * 4);
        }

        //Setup textures
        let useMipmaps = true; // Temporary
        let flipUVs = true; // Temporary
        this.Material.textures.forEach((tex_src) => {
            var image = new Image();
            image.src = tex_src;
            image.onload = () => { //Insted of "bind(this)"
                var texture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, image.width, image.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
                if(useMipmaps){
                    this.gl.generateMipmap(this.gl.TEXTURE_2D);
                }
                if(flipUVs){
                    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
                }
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, useMipmaps ? this.gl.LINEAR_MIPMAP_LINEAR : this.gl.LINEAR); // Minification, use of mip-maps
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR); //Magnification - upscaling the texture

                this.Material.texSamplers.push(texture);
            };  
        })

        //Optionally setup EBO
        if(this.indices.length != 0){
            this.EBO = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);
            if(this.EBO){
                console.log("[MESH] EBO init successful")
            }else{
                console.error("[MESH] EBO initialization Error");
            }
        }
        this.gl.bindVertexArray(null);
    }

    /**
     * @summary - Initializes shader used for picking by mouse (selecting objects in the scene by mouse)
     * @param {Shader} PickShader 
     */
    initPicking(PickShader){
        PickShader.use();

        this.VAO_Pick = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.VAO_Pick);
        
        /* Link VBO */
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);

        let posLocation = this.gl.getAttribLocation(PickShader.Program, "a_position");
        if(posLocation > -1){
            this.gl.enableVertexAttribArray(posLocation);
            this.gl.vertexAttribPointer(posLocation, 3, this.gl.FLOAT, false, 0, 0);
        }
        /* Link EBO */
        if(this.indices.length != 0){
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO);
        }

        this.gl.bindVertexArray(null);
    }

    /**
     * @summary Binds uniforms to shader
     */
    setUniforms(){
        var Ambientlocation = this.gl.getUniformLocation(this.Shader.Program, "material.ambient");
        this.gl.uniform3fv(Ambientlocation, this.Material.ambient);

        var Diffuselocation = this.gl.getUniformLocation(this.Shader.Program, "material.diffuse");
        this.gl.uniform3fv(Diffuselocation, this.Material.diffuse);

        var Specularlocation = this.gl.getUniformLocation(this.Shader.Program, "material.specular");
        this.gl.uniform3fv(Specularlocation, this.Material.specular);

        var Shininesslocation = this.gl.getUniformLocation(this.Shader.Program, "material.shininess");
        this.gl.uniform1f(Shininesslocation, this.Material.shininess);
    }

    /**
     * @summary Binds textures to shader
     */
    setTextures(){
        for(var i = 0; i < this.Material.texSamplers.length; i++) {
            let texture = this.Material.texSamplers[i];
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

            var texSamplerLocation = this.gl.getUniformLocation(this.Shader.Program, "texUnit[" + i + "]");
            this.gl.uniform1i(texSamplerLocation, 0 + i);
        }
        var texUnitCountLocation = this.gl.getUniformLocation(this.Shader.Program, "TEX_UNITS_SIZE");
        this.gl.uniform1i(texUnitCountLocation, this.Material.texSamplers.length);
    }

    /**
     * @summary - Deletes geometry of this Mesh - call after model destructor is called
     */
    deleteGeometry(){
        this.gl.deleteVertexArray(this.VAO);
    }

    /**
     * @summary - Draws the mesh
     * @param {CubeMap} _envMap - CubeMap reference (if used) for rendering Environment map reflection
     */
    draw(_envMap = null, reflectance = 0.19){
        this.gl.bindVertexArray(this.VAO);
        this.setUniforms();
        if(this.Material.texSamplers.length > 0){
            /* Hack to resolve the problem with "undefined" texSampler, which is bound to texSampler0 by default.. and used by shader */
            if(!_envMap){
                let skyboxTexLocation = this.gl.getUniformLocation(this.Shader.Program, "eMap_texUnit");
                this.gl.uniform1i(skyboxTexLocation, 10); 
            }

            this.setTextures();
        }else{
            var texUnitCountLocation = this.gl.getUniformLocation(this.Shader.Program, "TEX_UNITS_SIZE");
            this.gl.uniform1i(texUnitCountLocation, 0);
        }

        if(_envMap){
            if(reflectance == 0.19){
                reflectance = (this.Material.specular[0] + this.Material.specular[1] + this.Material.specular[2]) / 3.0;
            }
            _envMap.setEnvMapUniforms(this.Shader.Program, reflectance, 2); // 0 Diffuse, 1 Specular
        }

        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    /**
     * @summary - Draws data into optional Pick (ID) Buffer
     */
    drawPickBuffer(){
        this.gl.bindVertexArray(this.VAO_Pick);
        //SetUniforms() - not necessary, IDs are stored in model ( one ID per Model)
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.activeTexture(this.gl.TEXTURE0);
    }
}
/**
 * More materials NOT supported - Maybe done later
 */