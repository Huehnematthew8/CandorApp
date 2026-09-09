"""Isolated synthetic workspaces for the supervised usability pass."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
root=Path(__file__).resolve().parent.parent/'_archive/usability-working-fixtures'
def serve(port,name):
 class Handler(BaseHTTPRequestHandler):
  def do_GET(self):
   if self.path.split('?')[0] not in ['/', '/app.html']:
    self.send_error(404);return
   body=(root/(name+'.html')).read_bytes()
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
 HTTPServer(('127.0.0.1',port),Handler).serve_forever()
threads=[Thread(target=serve,args=(port,name)) for port,name in [(8772,'first'),(8773,'busy'),(8774,'active')]]
for t in threads:t.start()
for t in threads:t.join()
