from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Handle games directory listing request
        if self.path == '/list-games':
            try:
                games_path = os.path.join(os.getcwd(), 'games')
                games = [d for d in os.listdir(games_path) 
                        if os.path.isdir(os.path.join(games_path, d)) and 
                        os.path.exists(os.path.join(games_path, d, 'data', 'config.json'))]
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(games).encode())
                return
            except Exception as e:
                print(f"Error listing games: {e}")
                self.send_error(500, "Internal Server Error")
                return

        # Special handling for directory listing requests (for music files)
        if self.path.startswith('/games/') and self.path.endswith('/sounds/'):
            try:
                # Convert URL path to filesystem path
                path = os.path.join(os.getcwd(), self.path.lstrip('/'))
                
                # Get list of files in directory
                files = os.listdir(path)
                
                # Create HTML directory listing
                content = '<html><body><ul>'
                for f in files:
                    if f.endswith('.m4a'):
                        content += f'<li><a href="{f}">{f}</a></li>'
                content += '</ul></body></html>'
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(content.encode())
                return
            except Exception as e:
                print(f"Error handling directory listing: {e}")
                
        return SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print('Server running on port 8000...')
    httpd.serve_forever()