# Simple HTTP server version
# When executing this script, navigate to: http://localhost:2222/public/
from http.server import SimpleHTTPRequestHandler
import socketserver


class CORSRequestHandler (SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        SimpleHTTPRequestHandler.end_headers(self)


Handler = CORSRequestHandler
Handler.extensions_map['.wasm'] = 'application/wasm'

PORT = 2222

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()