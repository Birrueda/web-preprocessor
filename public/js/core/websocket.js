const socket = new WebSocket("ws://localhost:8000/api/ws/map");
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
    console.log("Message from server ", event.data);
    // ws_send_serialized_data();
}

function ws_send_serialized_data()
{
    const src = imgPreInstance.get_serialized_results();
    console.log("SOURCE: ")
    console.log(src);
    const copy = Uint8Array.from(src);
    socket.send(copy)
}

function ws_send_map_name(name) {
    const arrBuffer = enc.encode(name);
    socket.send(arrBuffer.buffer);
}