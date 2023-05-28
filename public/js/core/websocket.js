const socket = new WebSocket("ws://localhost:8000/api/ws/map");
socket.binaryType = "arraybuffer";
var enc = new TextEncoder(); // always utf-8

// Connection opened
socket.addEventListener("open", ws_connection_opened);

// Listen for messages
socket.addEventListener("message", ws_server_message_callback);

function ws_connection_opened(event) {
    console.log("Connection is up, sending map name")
    ws_send_map_name('test');
}
  
function ws_server_message_callback(event) {
    // TODO: Switch case with commands from server
    const command = new DataView(event.data).getFloat32(0);
    // console.log("Received command from server: ", command);
    ws_send_serialized_data();
}

function ws_send_serialized_data()
{
    const src = imgPreInstance.get_serialized_results();
    const copy = Uint8Array.from(src);
    socket.send(copy)
}

function ws_send_map_name(name) {
    const arrBuffer = enc.encode(name);
    socket.send(arrBuffer.buffer);
}