# Web preprocessor

This repository holds a demo of the image preprocessor running on a web page.
The web preprocessor page access the webcam and execute webassembly, so it won't run as files in your browser, you need a server.
This repository has a very simple Python web server without security.  Usually it won't work because its lack of certificates.  To make the page work in chrome (PC or mobile), you need to add the server url to chrome://flags/#unsafely-treat-insecure-origin-as-secure only once, enable it and relaunch your browser

# Running the server

Once you clone or downloaded this repository to a local folder, open a terminal in that folder and type

    python3 server.py

or

    python server.py

As the server start it will show its own url.  You can simply navigate to it.

# Preprocessor web demo

This is a TODO list as you navigate to it the first time:

- as stated before, add the server url to chrome://flags/#unsafely-treat-insecure-origin-as-secure only once, enable it and relaunch your browser
- chrome may ask permission to open de camera, allow it

Afer a few seconds, you will see two images and data:

- the feed from the camera
- a monochromatic version, captured once a second, with green circle annotations
- preprocess time
- video resolution

That's it, your preprocessor is working.

# Why all this

The web preprocessor is part of a bigger system.  It main role is to capture an image, preprocess it extracting features (keypoints and descriptors), and send it to a server with visual slam to further processing.

This demo get those features but it do nothing with them.  You can see the keypoints annotations, as a visual confirmation that the preprocessing is actually doing what it is supposed to do.

If you edit the js files, remember to force refresh with shift+F5 in Chrome, so it discards old versions from cache.

# Project structure

- server.py is the only file for the web server
- web page
    - index.html
    - index.css
    - index.js runs the page and invoke the preprocess method once a second
    - wasm folder has three files produced by emscripten, with the preprocessor itself

emscripten-bindings repository has all the files necessary to generate the wasm folder.  They are already here, but if you want to modify the preprocessor, you'll need to build it from scratch.