from http.server import BaseHTTPRequestHandler,HTTPServer
from pathlib import Path
import sys
class Preview(BaseHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0] not in ['/', '/app.html']:
   self.send_error(404);return
  body=(Path(__file__).resolve().parent.parent/'app.html').read_bytes()
  self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(body)
HTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8770),Preview).serve_forever()
