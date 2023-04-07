const DEBUG = true;

function allocate_mask_rectangles() {

    const maskArr1 = new Float32Array([1.2, 2.3, 3.4, 4.4]);
    const maskArr2 = new Float32Array([1.2, 2.3, 3.4, 4.4]);
    const maskArr3 = new Float32Array([1.2, 2.3, 3.4, 4.4]);
    const maskArr4 = new Float32Array([1.2, 2.3, 3.4, 4.4]);
    
    const numBytes = maskArr1.length * maskArr1.BYTES_PER_ELEMENT;

    try {
        // Allocate memory in the heap
        const dataPtr1 = Module._malloc(numBytes);    
        new Float32Array(Module.HEAPF32.buffer, dataPtr1, numBytes).set(maskArr1);

        const dataPtr2 = Module._malloc(numBytes);
        new Float32Array(Module.HEAPF32.buffer, dataPtr2, numBytes).set(maskArr2);

        const dataPtr3 = Module._malloc(numBytes);
        new Float32Array(Module.HEAPF32.buffer, dataPtr3, numBytes).set(maskArr3);

        const dataPtr4 = Module._malloc(numBytes);
        new Float32Array(Module.HEAPF32.buffer, dataPtr4, numBytes).set(maskArr4);

        // Allocate an array that contains the previous pointers
        const pointerArray = new Uint32Array([dataPtr1, dataPtr2, dataPtr3, dataPtr4]);
        const nBytes = pointerArray.length * pointerArray.BYTES_PER_ELEMENT;
        const pointerArrayPtr = Module._malloc(nBytes);
        new Uint32Array(Module.HEAPU32.buffer, pointerArrayPtr, nBytes).set(pointerArray);

        return {
            dataPtr1: dataPtr1,
            dataPtr2: dataPtr2,
            dataPtr3: dataPtr3,
            dataPtr4, dataPtr4,
            ptr_to_ptr_mask_arr: pointerArrayPtr
        };
    } catch (error) {
        console.log(error);
        window.location.reload();
    }
}
function instantiate_imagepreprocessor_client() {    
    // Since version 0.3.3 named min_size. 
    // Size of node occupied by one feature point. The larger this value, the fewer feature points are extracted.
    // https://stella-cv.readthedocs.io/en/latest/parameters.html
    const maxNumKeyPoints = getMinSize();
    const imgPreInstance = new Module.ImagePreprocessor(
        maxNumKeyPoints,
        DEBUG
    );
    
    return imgPreInstance;
}


function instantiate_imagepreprocessor_server(slamMode) {    
    // Since version 0.3.3 named min_size. 
    // Size of node occupied by one feature point. The larger this value, the fewer feature points are extracted.
    // https://stella-cv.readthedocs.io/en/latest/parameters.html
    const maxNumKeyPoints = getMinSize();
    const serverIP = getServerIP();
    const imgPreInstance = new Module.ImagePreprocessor(
        maxNumKeyPoints,
        serverIP,
        slamMode,
        DEBUG
    );
    
    return imgPreInstance;
}


function instantiate_imagepreprocessor_with_mask(slamMode)  {
    const rectAlloc = allocate_mask_rectangles();

    // Since version 0.3.3 named min_size. 
    // Size of node occupied by one feature point. The larger this value, the fewer feature points are extracted.
    // https://stella-cv.readthedocs.io/en/latest/parameters.html
    const maxNumKeyPoints = getMinSize();
    const serverIP = getServerIP();
    
    const orbParams = {
        name: "default ORB feature extraction setting",
        scale_factor: 1.2,
        num_levels: 8,
        ini_fast_threshold: 20,
        min_fast_threshold: 7,
    };
    
    const imgPreInstance = new Module.ImagePreprocessor(
            rectAlloc.ptr_to_ptr_mask_arr, 
            maxNumKeyPoints,
            orbParams.name, 
            orbParams.scale_factor, 
            orbParams.num_levels,
            orbParams.ini_fast_threshold,
            orbParams.min_fast_threshold,
            serverIP,
            slamMode,
            DEBUG
    );

    Module._free(rectAlloc.dataPtr1);
    Module._free(rectAlloc.dataPtr2);
    Module._free(rectAlloc.dataPtr3);
    Module._free(rectAlloc.dataPtr4);
    Module._free(rectAlloc.pointerArrayPtr);

    return imgPreInstance;
}