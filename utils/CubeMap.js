/**
 * CubeMap
 * @summary Class that represents cubemap and provides methods for rendering skybox and environment mapping
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class CubeMap {
    /**
     * 
     * @param {WebGL2RenderingContext} _gl - Reference to webgl context
     * @param {CtuGL} _ctugl - Reference to CtuGL instance
     * @param {String} _srcFolder - Source folder with texture, without backslash on the end
     * @param {Shader} _shader - Reference to shader instance
     * @param {Array[String]} _names - Names of textures, MUST by in order [ +x, -x, +y, -y, +z, -z ]
     */
    constructor(_gl, _ctugl, _srcFolder, _shader, _names = null){
        this.gl = _gl;
        this.ctugl = _ctugl;

        this.names = _names;
        this.names = [
            "pos-x.jpg", "neg-x.jpg", "neg-y.jpg", "pos-y.jpg", "pos-z.jpg", "neg-z.jpg"
        ]; // OpenGL right handed version
        /* Default targets - needs to be synchronized with Cubemap images order */
        this.targets = [
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];   

        /* Init Shader Program */
        this.Shader = _shader;
        this.texture;

        /* Skybox represented by quad (2D) Clip-Space coordinates [-1, 1]
         * These vertices cover the whole screen
        */
        this.vertices = new Float32Array([
            -1, -1, 1, -1, -1, 1,   // 1st triangle
            -1,  1, 1, -1,  1, 1    // 2nd triangle
        ]);
        /* Init Skybox Geometry */
        this.VAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.VAO);

        this.VBO = this.gl.createBuffer(this.gl.ARRAY_BUFFER);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);

        let posLocation = this.gl.getAttribLocation(this.Shader.Program, "a_position"); //Vertex (attribute) position
        if( posLocation > -1 ){
            this.gl.enableVertexAttribArray(posLocation);
            this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);
        }else{
            this.ctugl.log("PosLocation not initialized!", "[SkyBox][Error]");
        }

        this.init(_srcFolder);
    }

    /**
     * @summary - Creates cubemap texture. Names shoud be pos-x.jpg, neg-x.jpg etc.
     * @param {String} srcFolder - Source folder with skybox images
     */
    init(srcFolder){
        /* Setup texture */
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);

        /* Load Texture Faces */
        let iterator = 0;
        this.names.forEach((srcName) => {
            const path = `${srcFolder}/${srcName}`;

            const target = this.targets[iterator];  // Target
            const level = 0;                        // Level
            const internalFormat = this.gl.RGBA;    // Internal format
            const width = 512;                      // Fixed texture width for all faces
            const height = 512;                     // Fixed texture height for all faces
            const imgFormat = this.gl.RGBA;         // Image format
            const dataType = this.gl.UNSIGNED_BYTE; // Data Type
            const border = 0;                       // Border width (old, use 0 everytime)

            /* Create empty texture to allocate the memory */
            this.gl.texImage2D(target, level, internalFormat, width, height, border, imgFormat, dataType, null);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            /* Load the appropriate image */
            /*this.loadImage(path)
            .then((image) => {
                this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);
                this.gl.texImage2D(target, level, internalFormat, imgFormat, dataType, image);
                this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
            })
            .catch((error) => {
                this.ctugl.log(error, "[CubeMap][Error]");
            });*/
            let image = new Image();
            image.src = path;
            image.addEventListener('load', () => {
                this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
                this.gl.texImage2D(target, level, internalFormat, imgFormat, dataType, image);
                this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
                this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
            })

            iterator++;
        });

        /* Finalize */
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
    }

    loadImage(path){
        var promise = new Promise((resolve, reject) => {
            let image = new Image();
            /* Image loading state listeners */
            image.addEventListener('load', (img) => resolve(img));
            image.addEventListener('error', (error) => {
                reject(error);
            })

            image.src = path;
        })
        return promise;
    }

    setUniforms(VP_Matrix_inverse){
        let skyboxTexLocation = this.gl.getUniformLocation(this.Shader.Program, "texUnit");
        this.gl.uniform1i(skyboxTexLocation, 0); // Bind texturing unit 0 

        var VP_Matrix_location = this.gl.getUniformLocation(this.Shader.Program, "u_VP_inverse");
        this.gl.uniformMatrix4fv(VP_Matrix_location, gl.FALSE, VP_Matrix_inverse);
    }

    /**
     * @summary - Draw the SkyBox
     * @param {Matrix4f} VP_inverse - Matrix 
     */
    draw(VP_inverse){
        this.gl.bindVertexArray(this.VAO);

        this.Shader.use();

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
        
        this.setUniforms(VP_inverse);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 1 * 6);
    }

    /**
     * 
     * @param {WebGLProgram} program - Reference to shader program (not Shader instance!!)
     * @param {Float} reflectance - Amount of reflected environment
     * @param {Integer} texUnitIdx - Texturing unit ID - 0 + DiffuseUnit + Specular Unit + ....
     *                              - atleat 2, default value is 10 (if no value provided in parameter)
     */
    setEnvMapUniforms(program, reflectance, texUnitIdx = 10){
        this.gl.activeTexture(this.gl.TEXTURE0 + texUnitIdx);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);

        let useEnvMapLocation = this.gl.getUniformLocation(program, "genEnvMap");
        this.gl.uniform1i(useEnvMapLocation, 1); 

        let reflectanceLocation = this.gl.getUniformLocation(program, "reflectance");
        this.gl.uniform1f(reflectanceLocation, reflectance); 

        let skyboxTexLocation = this.gl.getUniformLocation(program, "eMap_texUnit");
        this.gl.uniform1i(skyboxTexLocation, 0 + texUnitIdx); // Bind texturing unit 0 
    }
}