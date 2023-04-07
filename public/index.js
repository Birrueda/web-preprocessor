var imgPreInstance;
var Module = {
    onRuntimeInitialized: async function() { 
        console.log("WebAssembly Module finished loading");       
        imgPreInstance = instantiate_imagepreprocessor_client();				
        setTimeout(()=> {
            captureFrames();
        }, 1000);		
    }
};