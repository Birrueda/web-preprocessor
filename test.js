// Same as index, with extra code at loop
console.log("web-preprocessor server.py test.js");

// Singleton of wasm ImagePreprocessor
var preprocessor;

// Module singleton will grow and include emscripten bindings when main.js initialize wasm module
var Module = {
    onRuntimeInitialized: async ()=>{
        console.log("WebAssembly Module loaded", Module, Module.Preprocessor);
        preprocessor = new Module.Preprocessor(1500);
        console.log("preprocessor initialized");
        setTimeout(()=>{console.log("setup", window.setup);console.log(setup);setup();}, 1000); // setup is defined in index.js
    }
};

// video from camera
const video = document.getElementById('video');
const runCheck = document.getElementById('run');

// internal hidden canvas to capture images from video
const inputCanvas = document.getElementById('input');
const inputImageContext = inputCanvas.getContext('2d', {alpha: false, willReadFrequently: true, /*desynchronized: true*/});;

// canvas to show annotated output
const outputCanvas = document.getElementById('output');
const outputImageContext = outputCanvas.getContext('2d', {desynchronized: true, alpha: false});

// text placeholders
const durationPlaceholder = document.getElementById("preprocess-duration");
const durationList = document.getElementById("duration-list");
const resolutionPlaceholder = document.getElementById("resolution");

// wasm ready, Module and preprocessor available
async function setup(){
    console.log("setup...");
    // Open camera
    video.srcObject = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video:{
            width: {ideal: video.width},
            height: {ideal: video.height}
        }
    });

    video.onloadedmetadata = (e)=>{
        console.log("Video width: " + video.videoWidth);
        console.log("Video height: " + video.videoHeight);
        // set the canvas to the dimensions of the video feed
        inputCanvas.width = video.videoWidth;
        inputCanvas.height = video.videoHeight;
        outputCanvas.width = video.videoWidth;
        outputCanvas.height = video.videoHeight;
    };

    await video.play();

    // starts the annotation loop
    setInterval(loop, 1000);
}

function loop(){
    if(!runCheck.checked) return;
    console.log("-------------------------------");
    // Capture image from video and put it in the heap, so wasm can grab it
    const width = video.videoWidth;
    const height = video.videoHeight;
    resolutionPlaceholder.innerText = width + " x " + height;
    inputImageContext.drawImage(video, 0, 0, width, height);
    const imgData = inputImageContext.getImageData(0, 0, width, height);    // uint8clampedarray, compatible with Uint8Array
    const numBytes = imgData.data.length * imgData.data.BYTES_PER_ELEMENT;
    const dataPtr = Module._malloc(numBytes);   // Allocate memory in the heap
    const dataOnHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, numBytes);
    dataOnHeap.set(imgData.data);

    // Preprocess image on buffer
    try{
        let startTime = performance.now();
        features = preprocessor.preprocess(dataOnHeap.byteOffset, width, height);
        let preprocessDuration = performance.now() - startTime;
        var duration = Math.floor(preprocessDuration);
        durationPlaceholder.innerText = duration;
        durationList.innerText += ", " + duration;
        console.log("features", features);
        console.log("preprocess duration", preprocessDuration);

        n = features.array.length/3;
        console.log("At:", n*2, n*2/16);
        var text = "";
        for(i=0; i<8; i++){
            text += features.array[n*2+i] + ", ";
        }
        console.log("Bytes:", text);
        dataView = new DataView(features.array.buffer);
        console.log("Keypoint 0:", dataView.getInt32(n*2, true), dataView.getInt32(n*2+4, true));
        dataView = new DataView(features.array.buffer, n*2, n);
        console.log("Keypoint 0:", dataView.getInt32(0, true), dataView.getInt32(4, true));
        //console.log("Keypoint 0:", dataView.getFloat32(0, true), dataView.getFloat32(4, true));
        //console.log("Keypoint last:", dataView.getFloat32(n-16, true), dataView.getFloat32(n-16+4, true));

    } catch(err) {
        console.log("error", err);
    } finally {
        Module._free(dataPtr);
        console.log("image memory released");
    }

    // Show annotated image
    /*annotatedImage = preprocessor.getAnnotations();
    if(annotatedImage){
        outputImageContext.putImageData(new ImageData(new Uint8ClampedArray(annotatedImage.array), annotatedImage.width, annotatedImage.height), 0, 0);
    }*/
}

console.log("index.js finished");