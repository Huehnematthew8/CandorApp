from http.server import BaseHTTPRequestHandler,HTTPServer
from pathlib import Path
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  if self.path not in ['/', '/layout.html']:
   self.send_error(404);return
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(Path(__file__).with_suffix('.html').read_bytes())
HTTPServer(('127.0.0.1',8776),Handler).serve_forever()
