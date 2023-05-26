# Web preprocessor

Extract keypoints and descriptors using your broswer.

## Running the server

Due to security restrictions implemented by Chrome and other browswers around WASM files, a server is needed to serve the files associated with this project.

### Python Guide

- Python >= 3.8

This repository comes with a python script which uses `http.server` standard library. To run the server, execute:

    python server.py

Server will start up on port 2222. Then, navigate to http://localhost:2222/public/ in order to access the application.

### Node Guide

- Node >= 14

In order to run this application, you must have installed Node and a packet manager (npm, pnpm, yarn, pick your poison).

Node comes with npm as a default packet manager.

After installing node, please execute:

    npm install

To install other dependencies. Then, to start up the server, all you need to do is execute the following command:

    npm run start


Server will start up on port 2222.

## How to test on mobile

In order to use this on mobile devices, you have to allow camera permissions on the browser used for the testing.

In the case of Google Chrome, you must navigate to
`chrome://flags/#unsafely-treat-insecure-origin-as-secure`

Then you must add the IP for the device that is running the local server and the port. After that you will be able to use the camera in Chrome.

For example:

`http://192.168.0.24:2222`

## How to change video resolution and other parameters

Open /public/js/core/util.js.

Change return values of the methods to your pleasure.