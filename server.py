from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import urllib.parse  # added for URL parsing
import signal

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Debug print for incoming request path
        print(f"Incoming request: {self.path}")
        
        # Parse the URL to separate the path and query
        parsed = urllib.parse.urlparse(self.path)
        print(f"Parsed path: {parsed.path}, Query: {parsed.query}")
        
        # Add debug logging for rooms.json and items.json
        if 'rooms.json' in parsed.path or 'items.json' in parsed.path:
            print(f"Attempting to serve file: {parsed.path}")
            try:
                file_path = os.path.join(os.getcwd(), parsed.path.lstrip('/'))
                print(f"Full file path: {file_path}")
                print(f"File exists: {os.path.exists(file_path)}")
            except Exception as e:
                print(f"Error checking file: {e}")
        
        # Check if the request path starts with '/list-games'
        if parsed.path.startswith('/list-games'):
            print('Handling /list-games request')
            try:
                # Use the script's directory instead of current working directory
                base_dir = os.path.dirname(os.path.abspath(__file__))
                games_path = os.path.join(base_dir, 'games')
                games = [d for d in os.listdir(games_path) 
                         if os.path.isdir(os.path.join(games_path, d)) and 
                         os.path.exists(os.path.join(games_path, d, 'data', 'config.json'))]
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps(games).encode()
                self.wfile.write(response)
                print(f"Responded with games: {games}")
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

def signal_handler(sig, frame):
    print('\nShutting down server gracefully...')
    httpd.shutdown()
    httpd.server_close()
    exit(0)

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print('Server running on port 8000... (Press Ctrl+C to quit)')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server gracefully...')
        httpd.shutdown()
        httpd.server_close()