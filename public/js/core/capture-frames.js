const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const outputCanvas = document.querySelector("#outputCanvas");
// For these attributes, see: 
// https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true, desynchronized: true});
// const debugCanvasContext = outputCanvas.getContext('2d');

// WebGL Related 
const gl = outputCanvas.getContext('webgl2', {
    desynchronized: true,
    alpha: false,
    // preserveDrawingBuffer: true
});

// Misc
const frame_skip = getFrameSkip();
let stopCapturing = false;

async function getCameraStream() {
    const promisifiedOldGUM = function (constraints, successCallback, errorCallback) {
        // First get ahold of getUserMedia, if present
        const getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia);

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (successCallback, errorCallback) {
            getUserMedia.call(navigator, constraints, successCallback, errorCallback);
        });

    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
    }

    const facingMode = isMobile() ? 'environment' : 'front';   
    
    const video_width = getWidth();
    const video_height = getHeight();

    const constraints = {  
        video: {
            facingMode:	facingMode,
            width: { min: video_width, ideal: video_width, max: 1920 },
            height: { min: video_height, ideal: video_height, max: 1080 },  
        },
        audio: false,
    };

    try {        
        video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
        video.onloadedmetadata = function (e) {
            /* set the canvas to the dimensions of the video feed */
            console.log("Video W: " + video.videoWidth);
            console.log("Video H: " + video.videoHeight);
            canvas.width = outputCanvas.width = video.videoWidth;
            canvas.height = outputCanvas.height = video.videoHeight;
        };
        await video.play();      
        return video;
    } catch(err) {
        alert(err);
        console.log(err);
    }
}

// Setups WebGL rendering for output canvas
function setupWebGl() {
    // setup GLSL program, for simplicity they are stored in HTML script tags
    // use webglUtils from https://webgl2fundamentals.org/
    const program = webglUtils.createProgramFromScripts(gl, [
        "vertex-shader-2d",
        "fragment-shader-2d",
    ]);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Set a rectangle the same size as the image.
    const x1 = 0;
    const x2 = 0 + video.videoWidth;
    const y1 = 0;
    const y2 = 0 + video.videoHeight;
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
        gl.STATIC_DRAW
    );

    // provide texture coordinates for the rectangle.
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
        ]),
        gl.STATIC_DRAW
    );
    
    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    // gl.texImage2D(
    // gl.TEXTURE_2D,
    // 0,
    // gl.RGBA,
    // gl.RGBA,
    // gl.UNSIGNED_BYTE,
    // video
    // );
  
    const u_image = gl.getUniformLocation(program, "u_image");

    // set which texture units to render with.
    gl.uniform1i(u_image, 0); // texture unit 0

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    {
        const size = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(
        positionLocation,
        size,
        type,
        normalize,
        stride,
        offset
        );
    }

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    {
        const size = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(
        texcoordLocation,
        size,
        type,
        normalize,
        stride,
        offset
        );
    }

    // lookup uniforms
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/*
* Captures frames without using setTimeout or needing delays
* Based on: https://stackoverflow.com/questions/32699721/javascript-extract-video-frames-reliably
*/
async function captureFrames() {
    if (HTMLVideoElement.prototype.requestVideoFrameCallback) {       
        await getCameraStream();

        // Setups WebGL rendering for output canvas
        setupWebGl();       

        ws_send_serialized_data();

        let frameCount = 0;
        const drawingLoop = (timestamp, frame) => {            
            frameCount++;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            try {                
                const ptr = loadImageToWASM();
                
                if (frameCount % frame_skip == 0)
                {
                    frameCount = 0;
                    let startTime = performance.now();
                    imgPreInstance.preprocess_image();
                    ws_send_serialized_data();
                    let preprocessDuration = performance.now() - startTime;
                    document.getElementById('preprocess-duration').innerText = Math.floor(preprocessDuration) + ' ms';                    
                }
                drawOutputImage();
                // Free allocated memory
                Module._free(ptr);
            } catch(err) {
                console.log(err);
                stopCapture();
            }

            if (!stopCapturing) {
                video.requestVideoFrameCallback(drawingLoop);
            }
        };

        video.requestVideoFrameCallback(drawingLoop);    

    } else {
        console.error("your browser doesn't support this API yet");
    }
}

async function drawOutputImage()
{
    const outputImage = imgPreInstance.get_output_image();    
    
    if (outputImage)
    {
        gl.flush();
        gl.finish();
        // Update texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, outputImage);
        // Draw the image
        gl.drawArrays(gl.TRIANGLES, 0, 6);       
    }
}

function loadImageToWASM() {
    // Turns out, WebGL is faster at drawing than canvas, but calling gl.readPixels incredibly tanks performance.
    // Using 2d context getImageData I obtained 10ms on a Moto G7 Power.
    // When switching to gl.readPixels, it jumped from 20ms to 54ms randomly.
    // Seems best to compromise and use WebGL for rendering the output canvas, while maintaining 2d context for the input canvas.    
    
    // const readPixelBuffer = new Uint8Array(video.videoWidth * video.videoHeight * 4);
    // gl.readPixels(0, 0, video.videoWidth, video.videoHeight, gl.RGBA, gl.UNSIGNED_BYTE, readPixelBuffer);
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const heapInfo = loadImageIntoHeap(imgData);
    
    imgPreInstance.load_image(heapInfo.byteOffset, canvas.width, canvas.height);
   
    return heapInfo.dataPtr;
}

// Loads the array into webassembly heap
function loadImageIntoHeap(imgData) {
    // imgData.data already is a uint8clampedarray, so it is useless to create a new array
    // const uint8ArrData = new Uint8Array(imgData.data);
    
    const numBytes = imgData.data.length * imgData.data.BYTES_PER_ELEMENT;
    // Allocate memory in the heap
    const dataPtr = Module._malloc(numBytes);
    const dataOnHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, numBytes);
    dataOnHeap.set(imgData.data);

    return {
        byteOffset: dataOnHeap.byteOffset,        
        dataPtr: dataPtr,
    };
}

/*
*
*   MISCELLANEOUS METHODS
*
*/

function stopCapture() {
    video.srcObject = null;
    stopCapturing = true;
}
