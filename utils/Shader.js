/**
 * Shader
 * @summary Class that represents one shader program
 * @author Patrik Schiller
 * @date 27/02/2020
 * @license MIT
 */
class Shader {
    /**
     * 
     * @param {WebGLRenderingContext} gl_ 
     * @param {String} VS_src 
     * @param {String} FS_src 
     */
    constructor(gl_, VS_src, FS_src){
        this.VS = null;
        this.FS = null;
        this.Program = null;
        this.gl = gl_;

        this.initShader(VS_src, FS_src);
    }

    /**
     * @summary - Returns GLSL shader source from GLSL file
     * @param {String} url 
     */
    static getShaderSource(url){
        var req = new XMLHttpRequest();
        req.open("GET", url, false);
        req.send(null);
        return (req.status == 200) ? req.responseText : null;
    }

    /**
     * @summary Initializes shader for further usage
     */
    initShader(VS_src, FS_src){
        this.VS = this.setVertexShader(VS_src);
        this.FS = this.setFragmentShader(FS_src);  
        if(this.VS && this.FS){
            this.Program = this.createProgram();
        }else{
            console.error("[Shader] Error in shader init");
        }
    }

    /**
     * @summary Creates and compiles Vertex Shader from source
     * @param {String} VS_src 
     */
    setVertexShader(VS_src){
        var VS = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(VS, VS_src);
        this.gl.compileShader(VS);
        if(this.gl.getShaderParameter(VS, this.gl.COMPILE_STATUS)){
            console.log('[Shader][VS] successfully compiled');
            return VS;
        }
        console.error(this.gl.getShaderInfoLog(VS));
        console.error('[Shader][VS] Not compiled');
        return null;
    }

    /**
     *@summary Creates and compiles Fragment Shader from source
     * @param {String} FS_src 
     */
    setFragmentShader(FS_src){
        var FS = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(FS, FS_src);
        this.gl.compileShader(FS);
        if(this.gl.getShaderParameter(FS, this.gl.COMPILE_STATUS)){
            console.log('[Shader][FS] successfully compiled');
            return FS;
        }
        console.error(this.gl.getShaderInfoLog(FS));
        console.error('[Shader][FS] Not compiled');
        return null;
    }

    /**
     * @summary Creates shader program using precompiled VS and FS
     */
    createProgram(){
        var program = this.gl.createProgram();
        this.gl.attachShader(program, this.VS);
        this.gl.attachShader(program, this.FS);

        this.gl.linkProgram(program);

        if(this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
            console.log("[Shader] Shader program successfully linked");
            return program;
        }
        console.error(this.gl.getProgramInfoLog(program));
        console.error("[Shader] Shader program not linked");
        return null;
    }

    /**
     * @summary Uses program for rendering
     */
    use(){
        this.gl.useProgram(this.Program);
    }

    /**
     * @summary Deletes shaders and program
     */
    delete(){
        this.gl.detachShader(this.Program, this.VS);
        this.gl.detachShader(this.Program, this.FS);
        this.gl.deleteShader(this.VS);
        this.gl.deleteShader(this.FS);
        this.gl.deleteProgram(this.Program);
    }
}