/**
 * CtuGL - core 
 * @summary Core class with main functions
 * @author Patrik Schiller
 * @date 11/02/2020
 * @license MIT
 * 
 * 
 */
class CtuGL {
    constructor(gl_context){
        this.gl = gl_context;
        this.shaderCount = 1; //Init count
        this.programCount = 1; //Init count
    }

    /**
     * @summary creates shader (WebGLShader) based on given type (e.g. GL_FRAGMENT_SHADER / GL_VERTEX_SHADER)
     * @param {GL_ENUM} type 
     * @param {String} src 
     * @returns {WebGLShader}
     */
    createShaderFromSource(type, src){
        var shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        this.checkShader(shader);
        return shader;
    }

    /**
     * @summary creates shader program (WebGLProgram)
     * @param {Array(WebGLShader)} shaders 
     * @returns {WebGLProgram}
     */
    createProgram(shaders){
        var program = this.gl.createProgram();
        var shader;
        for(var idx in shaders){
           shader = shaders[idx];
           this.gl.attachShader(program, shader);
        }
        this.gl.linkProgram(program);
        this.checkProgram(program);
        return program;
    }

    /**
     * @summary - Asynchronously loads Shader source code into string
     * @param {String} path - relative path to the file ( preferably .glsl ) 
     * @returns {String} Shader source code
     */
    async loadShaderSource(path){
        const response = await fetch(path);
        const src = await response.text();
        return src;
    }

    /**
     * @summary - Creates new texture from given image with default settings
     * @summary - The easiest way to create texture
     * @param {String} path - Path to the image
     * @param {Integer} index - Index of texturing unit
     * @param {Boolean} mipmaps - Use mipmaps (default true)
     * @returns {WebGLTexture} - texture
     */
    createTexureSimple(path, index, mipmaps = true){
        let minFilter = mipmaps ? this.gl.LINEAR_MIPMAP_LINEAR : this.gl.LINEAR;
        let magFilter = this.gl.LINEAR;
        return this.createTexture(path , index, true, mipmaps, minFilter, magFilter);
    }

    /**
     * @summary - Creates new texture from given image
     * @param {String} path - Path to the image 
     * @param {Integer} texNumber - Number of texturing unit 
     * @param {Boolean} flipUV - Flip Y axes of texture coords
     * @param {Boolean} useMipmap - Generate mipmaps
     * @param {WebGLEnum} minFilter - filter for minification (in distance)
     * @param {WebGLEnum} magFilter - filter for magnification (close to the camera)
     * @returns {WebGLTexture} - texture
     */
    createTexture(path, texNumber = 0, flipUV = true, useMipmap = false, minFilter = undefined, magFilter = undefined){
        /* Prepare filtering attribs */
        if(useMipmap){
            minFilter ? minFilter : this.gl.LINEAR_MIPMAP_LINEAR;
        } else {
            minFilter ? minFilter : this.gl.LINEAR;
        }
        magFilter = magFilter ? magFilter : this.gl.LINEAR;

        /* Prepare temporary texture, before the image loads*/
        let texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + texNumber);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([20, 100, 20, 255]));

        /* Load the image */
        var image = new Image();
        image.src = path;
        image.addEventListener('load', function(){
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

            if( flipUV ){
                this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            }

            this.gl.texImage2D(
                this.gl.TEXTURE_2D, // Target - type of texture
                0,                  // Level
                this.gl.RGBA,       // Texture color format
                image.width,        // Texture width
                image.height,       // Texture height
                0,                  // Border width (old - use 0 everytime)
                this.gl.RGBA,       // Source color format
                this.gl.UNSIGNED_BYTE, // Source dataType
                image               // Reference to image
            )
        }.bind(this)); // Binds 'this' context as CtuGL instance (default 'this' is image context)

        /* Wrapping - not possible to change for now */
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        /* Texture filtering */
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);

        return texture;
    }

    /**
     * @summary deletes given WebGL program and all stuff associated with it
     * @param {WebGLProgram} program 
     */
    deleteProgramAndShaders(program){
        var shaders = this.gl.getAttachedShaders(program);
        for(var idx in shaders){
            this.gl.deleteShader(shaders[idx]);
            this.log("Shader deleted");
        }
        this.gl.deleteProgram(program);
        this.log("Program deleted");
    }

    /**
     * @summary helper for WebGL data types
     * @param {WebGL Enum} type 
     */
    sizeof(type){
        switch(type){
            case this.gl.BYTE:
            case this.gl.UNSIGNED_BYTE:
                return 1;
            case this.gl.SHORT:
            case this.gl.UNSIGNED_SHORT:
                return 2;
            case this.gl.FLOAT:
                return 4;
            default:
                this.error("Enum not found");
                return 0;
        }
    }

    /**
     * @summary - Multiplies given 4D vector by 4x4 Matrix
     * @param {Vector4} vec 
     * @param {Matrix4} mat 
     */
    multiplyVecMat(vec, mat){
        var vecOut = new Float32Array(4);

        vecOut[0] = mat[0] * vec[0] + mat[1] * vec[1] + mat[2] * vec[2] + mat[3] * vec[3];
        vecOut[1] = mat[4] * vec[0] + mat[5] * vec[1] + mat[6] * vec[2] + mat[7] * vec[3];
        vecOut[2] = mat[8] * vec[0] + mat[9] * vec[1] + mat[10] * vec[2] + mat[11] * vec[3];
        vecOut[3] = mat[12] * vec[0] + mat[13] * vec[1] + mat[14] * vec[2] + mat[15] * vec[3];

        return vecOut;
    }

    // INTERNAL UTILS
    /**
     * @summary checks compilation status of given shader (C code compilation)
     * @param {WebGLShader} shader 
     */
    checkShader(shader){
        var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!compiled) {
          console.error(this.gl.getShaderInfoLog(shader));
          console.log("["+this.shaderCount+"]Shader NOT compiled");
        }else{
            console.log("["+this.shaderCount+"]Shader successfully compiled");
        }
        this.shaderCount++;
    }
    /**
     * @summary checks linking status of given WebGL program
     * @param {WebGLProgram} program 
     */
    checkProgram(program){
        if ( !this.gl.getProgramParameter( program, this.gl.LINK_STATUS) ) {
            var info = this.gl.getProgramInfoLog(program);
            console.log("["+this.shaderCount+"]Program NOT linked");
        }else{
            console.log("["+this.programCount+"]Program successfully compiled");
        }
        this.programCount++;
    }

    /**
     * CTUGL log 
     * @param {String} msg 
     * @param {String} alt_prefix 
     */
    log(msg, alt_prefix = ""){
        var prefix = "[CtuGL]";
        console.log(prefix + alt_prefix + " " + msg);
    }
    /**
     * CTUGL Error
     * @param {String} err 
     * @param {String} alt_prefix 
     */
    error(err, alt_prefix = ""){
        var prefix = "[CtuGL][Error]";
        console.error(prefix + alt_prefix + " " + err);
    }

    /* Unit Matrix */
    unitMatrix = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
}