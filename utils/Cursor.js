/**
 * Cursor
 * @summary Class that represents screen cursor. Provides geometry for cursor rendering and method for handling Picking.
 * @author Patrik Schiller
 * @date 23/02/2020
 * @license MIT
 */
class  Cursor {
    /**
     * 
     * @param {WebGL2RenderingContext} _gl 
     * @param {Shader} _shader - Object ID Buffer shader - Shader that writes object IDs into RenderBuffer
     * @param {HTMLCanvasElement} _canvas 
     * @param {CtuGL} _ctugl 
     */
    constructor(_gl, _shader, _canvas, _ctugl){
        this.gl = _gl;
        this.pickShader = _shader;
        this.canvas = _canvas;
        this.ctugl = _ctugl;

        /* FrameBuffer Object ~= 'List of attachements' */
        /* We can render 1) To texture or 2) To Render Buffer or 3) To texture (colors) and to Render Buffer (depth..)*/
        /* Stencil and Depth values can be stored in the texture too :) */
        /* Render buffer is Write-only, data can be acces only via gl.readPixels() */
        /* Render buffers are faster the textures */
        /* https://learnopengl.com/Advanced-OpenGL/Framebuffers */
        /* https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html */
        this.FBO = null;
        this.RBO_Color = null;
        this.RBO_Depth = null;

        this.Geometry = {
            VAO : null,
            VBO : null,
            vertices : null,
            Shader : null,
            texture : null,
            scale : 0.04,
            texUnitLocation : null
        }
    }

    /**
     * @summary - Initializes cursor geometry
     */
    init(){
        /* Create empty Frame Buffer Object */
        this.FBO = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.FBO);

        /* Set FBOs content (attachements = memory location) to make it FrameBufferComplete - gl.FRAMEBUFFER_COMPLETE */
        // https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS

        /* Prepare Renderbuffer for colors */
        this.RBO_Color = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.RBO_Color);
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
        let colorTarget = this.gl.RGBA8UI; // Using 8 Unsigned Integers for every color Channel (2^8 R, 2^8 G, 2^8 B, 2^8 A) = (256 R, 256 G, 256 B, 256 A);  
        /* Setup render buffers. Set them same width and height as the main WebGL Framebuffer has (gl.drawingBuffer)*/
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, colorTarget, gl.drawingBufferWidth, gl.drawingBufferHeight);
        /* https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS */
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.RENDERBUFFER, this.RBO_Color);

        /* Prepare Renderbuffer for depth-test */
        this.RBO_Depth = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.RBO_Depth);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16,  gl.drawingBufferWidth, gl.drawingBufferHeight); // canvas.clientWidth & canvas.clientHeight can be used too
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.RBO_Depth);

        /* Check whether the Framebuffer is Complete */
        if(this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) == this.gl.FRAMEBUFFER_COMPLETE){
            console.log("[FrameBuffer][Cursor] Framebuffer successfully initialized!");
        }else{
            console.log("[FrameBuffer][Cursor][ERROR] Framebuffer initialization error - Frame buffer NOT COMPLETE!");
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    /**
     * @summary - Simulates mouse-click in the scene, retrieves ID of clicked object
     * @param {Float} mouseX 
     * @param {Float} mouseY 
     * @param {Integer} button 
     * @returns {Integer} ID of clicked object
     */
    processClickColorBuffer(mouseX, mouseY, button = 0){
        /* Bind the FBO - Next operation like draw() and read() will afect this FrameBuffer (and its renderbuffers / textures) */
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.FBO);
        this.gl.viewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

        /* Proces click into off-screen buffer */
        this.gl.bindFramebuffer(gl.FRAMEBUFFER, cursor.FBO);

        /* Prepare array for upcomming pixel */
        let pixels = new Uint32Array(1 * 1 * 4);
        /* Read the pixel and write it into the prepared array */
        /* = Read the area 1 pixel by 1 pixel under the cursor */
        this.gl.readPixels(mouseX, mouseY, 1, 1, gl.RGBA_INTEGER, gl.UNSIGNED_INT, pixels);
        var ID = pixels[0] + pixels[1];

        /* Do stuff with the ID ... */
        if(ID > 0){
            console.log("Clicked on ID: " + ID);
        }
        switch(ID){
            case 1:
                renderSettings.drawSkybox = !renderSettings.drawSkybox;
                break;
        }

        //console.log(pixels);
        /** IN CASE OF READING THE COLOR
         * var pixels = new Uint8Array(1 * 1 * 4);
         * console.log("X: " + centerX + "Y :" + centerY);
         * gl.readPixels(centerX, centerY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        */

         /* Unbind the FBO! Don't forget to do this! */
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        return ID;
    }

    deleteCursorContent(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.deleteFramebuffer(this.FBO);
    }

    /**
     * @TODO - NOT  IMPLEMENTED YET
     * @summary - Performs transformation of click ray in the screen Space into World Space direction vector
     *          - @todo - Calculate intersections
     * @param {Float} mouseX 
     * @param {Float} mouseY 
     */
    processClickRayCast(mouseX, mouseY){
       let screenRay = [mouseX, mouseY];

       /* 1) Convert screenRay from Screen [0.0 , 1.0]^2 space to NDC space by dividing the coords by ViewPort size (inverse gl.ViewPort())*/
       /* Result will be in range [<-1.0, 1.0>; <-1.0, 1.0> ; <0.0, 1.0>] , 3D */
       let screenWidth = canvas.clientWidth;
       let screenHeight = canvas.clientHeight;
       let z = 1.0; // This is the "direction into the Z-buffer"
       let X = (screenRay[0] * 2.0) / screenWidth - 1.0;
       let Y = (screenRay[1] * 2.0) / screenHeight - 1.0;
       /* Y axis is flipped, because of left, top coord system */
       let NDCRay = [X, - Y, z]; 

       /* 2) Convert the NDCRay from NDC space into Clip space (homogenous) by adding W coordinate and flipping the Z coodinate */
       /* ~ Inverse of dividing by W ( = -Z)  ~= inverse of coord normalization */
       /* Result will be in range [- W , + W]^3 , 3D (4D) */
       let w = 1.0; // We don't care about W, because the coordinates are already "divided" so they wouldn't need any other division (if needed)
       let ClipRay = [NDCRay[0], NDCRay[1], - NDCRay[2], 1.0];

       /* 3) Convert the ClipRay from Clip Space space [- W, + W]^3 into Camera Space [R]^3 by inverse Projection*/
       let CameraRay = ctugl.multiplyVecMat(ClipRay, m4.inverse(camera.Projection));
       /* We set Z to point in camera View direction (-1.0) and set W to 0.0 because we're transforming Vector (= direction), not Point */
       let MouseRay = [CameraRay[0], CameraRay[1], -1.0, 0.0];

       /* 4) Convert CameraRay from Camera space into World space by inverse View  */
       /* Now the "click" Ray is in the World space */
       var WorldRay = ctugl.multiplyVecMat(MouseRay, m4.inverse(camera.View));
       

       WorldRay = m4.normalize([WorldRay[0], WorldRay[1], WorldRay[2]]);

       /* Use the world ray to calculate instersections with object ...  */
    }

    /**
     * @summary - Initializes rendering geometry for crosshair
     * @param {Shader} _Shader 
     * @param {String} _imgSrc 
     */
    initGeometry(_Shader, _imgSrc){
        this.Geometry.vertices = new Float32Array([
            -1, -1,  1, -1,  -1, 1,   // 1st triangle
            -1,  1,  1, -1,   1, 1    // 2nd triangle
        ]);
        // We don't need UV coords, beacuse we can compute them from Vertex coords

        this.Geometry.VAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.Geometry.VAO);

        this.Geometry.VBO = this.gl.createBuffer(this.gl.ARRAY_BUFFER);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.Geometry.VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.Geometry.vertices, this.gl.STATIC_DRAW);

        this.Geometry.Shader = _Shader;

        let posLocation = this.gl.getAttribLocation(this.Geometry.Shader.Program, "a_position"); //Vertex (attribute) position
        if( posLocation > -1 ){
            this.gl.enableVertexAttribArray(posLocation);
            this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);
        }else{
            this.ctugl.log("PosLocation not initialized!", "[Cursor][Error]");
        }

        this.Geometry.texture = this.ctugl.createTexureSimple(_imgSrc, 1, false);
    }

    /**
     * @summary - Draws the crosshair. Needs to be drawn as last object.
     */
    draw(){
        this.gl.bindVertexArray(this.Geometry.VAO);
        this.Geometry.Shader.use();

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.Geometry.texture);
        
        let scaleLocation = this.gl.getUniformLocation(this.Geometry.Shader.Program, "scale");
        this.gl.uniform1f(scaleLocation, this.Geometry.scale); 

        let aspectLocation = this.gl.getUniformLocation(this.Geometry.Shader.Program, "aspectRatio");
        this.gl.uniform1f(aspectLocation, gl.drawingBufferWidth / gl.drawingBufferHeight); 

        let texLocation = this.gl.getUniformLocation(this.Geometry.Shader.Program, "texUnit");
        this.gl.uniform1i(texLocation, 0); // Bind texturing unit 0 

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 1 * 6);
        // If we want to render the cursor....
    }
}