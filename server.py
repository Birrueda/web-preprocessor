# Simple HTTP server version
# When executing this script, navigate to: http://localhost:2222/public/
from http.server import SimpleHTTPRequestHandler
import socketserver
import socket


class CORSRequestHandler (SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        SimpleHTTPRequestHandler.end_headers(self)


CORSRequestHandler.extensions_map['.wasm'] = 'application/wasm'

PORT = 8000

def get_my_ip_address(test="8.8.8.8"):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)    
    try:
        sock.connect((test, 80))
        return sock.getsockname()[0]
    finally:
        sock.close()

webServer = socketserver.TCPServer(("", PORT), CORSRequestHandler)
print("Connect to this web server through:")
print("http://", get_my_ip_address(), ":", PORT, "/index.html", sep='')
print("You should consider adding this url to chrome://flags/#unsafely-treat-insecure-origin-as-secure")
print("ctrl+c to stop web server")
webServer.serve_forever()

