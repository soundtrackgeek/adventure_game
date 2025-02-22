from http.server import HTTPServer, SimpleHTTPRequestHandler

class NoCacheHTTPHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, NoCacheHTTPHandler)
    print('Serving HTTP on port 8000 with cache control...')
    httpd.serve_forever()