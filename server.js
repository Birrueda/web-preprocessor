// Express
const express = require('express')
express.static.mime.types['wasm'] = 'application/wasm';
const app = express()

app.use(function(req, res, next) {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

//Serve static files from /public
app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        //Serve .wasm files with correct MIME type.
        if(path.endsWith('.wasm')) {
            res.set('Content-Type', 'application/wasm')
        }
    }
}))

//Start Server
app.listen(2222, () => console.log('Server running on port 2222!'))