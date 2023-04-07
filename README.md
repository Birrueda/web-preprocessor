# client-app

Due to security restrictions implemented by Chrome and other browswers around WASM files, a server is needed to serve the files associated with this project.

## Installation guide

- Node >= 14

In order to run this application, you must have installed Node and a packet manager (npm, pnpm, yarn, pick your poison).

Node comes with npm as a default packet manager.

After installing node, please execute:

npm install

To install other dependencies.

## Start server

To start up the server, all you need to do is execute the following command:

`npm run start`

The command will start up the server in the 2222 port.

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