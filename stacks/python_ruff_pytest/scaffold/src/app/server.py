"""Simple HTTP server for development and debugging."""

import json
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import os

from app.main import greet


class RequestHandler(BaseHTTPRequestHandler):
    """Handle HTTP requests."""

    def do_GET(self) -> None:
        """Handle GET requests."""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/health":
            self._send_json({"status": "ok", "timestamp": datetime.now().isoformat()})
        elif path == "/greet":
            name = query.get("name", ["World"])[0]
            self._send_json({"message": greet(name)})
        elif path == "/":
            self._send_json({"name": "python-app", "version": "0.0.1"})
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def _send_json(self, data: dict, status: int = 200) -> None:
        """Send JSON response."""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())


def main() -> None:
    """Start the HTTP server."""
    port = int(os.environ.get("PORT", 8000))
    server = HTTPServer(("0.0.0.0", port), RequestHandler)
    print(f"🚀 Server running at http://localhost:{port}")
    print(f"   Health: http://localhost:{port}/health")
    print(f"   Greet:  http://localhost:{port}/greet?name=YourName")
    server.serve_forever()


if __name__ == "__main__":
    main()
