/**
 * Mesh
 * @summary Class that represents settings which contain parameters of rendering.
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class RenderSettings {
    constructor(_gl, _bgColor = [0.3, 0.3, 0.3, 1.0]){
        /* Reference to WebGL contect */
        this.gl = _gl;
        /* Render distance - distance of far plane */
        this.renderDistance = 120.0;
        /* Fog */
        this.useFog = true;
        /* Draw skybox */
        this.drawSkybox = true;
        /* Environment mapping */
        this.envMap = true;
        /* Draw cross-hair */
        this.crossHair = true;
        /* Useage of mipmaps */
        this.backgroundColor = _bgColor;
        this.Mipmaps = {
            use : true,
            filtering : this.gl.LINEAR_MIPMAP_LINEAR
        };

        /* Texture settings */
        this.Textures = {
            use : true,
            flipY : true,
            minFilter : this.gl.LINEAR,
            magFilter : this.gl.LINEAR
        };
    }
}