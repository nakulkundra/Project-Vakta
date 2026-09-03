#!/usr/bin/env python3
"""
Project Vakta - Local Development & Testing Server
Serves Project Vakta web assets over HTTP with local network discovery.
"""

import http.server
import socket
import socketserver
import os
import sys

PORT = 8080

def get_local_ip():
    """Retrieve the primary local LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't even need to be reachable
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class VaktaHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable caching bypass for testing changes easily
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    # Change working directory to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    local_ip = get_local_ip()

    # Try binding to PORT, or increment if busy
    port = PORT
    for attempt in range(10):
        try:
            server = socketserver.TCPServer(("", port), VaktaHandler)
            break
        except OSError:
            port += 1
    else:
        print("Error: Could not bind to an open port.")
        sys.exit(1)

    # Ensure UTF-8 output on Windows consoles
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("=" * 65)
    print("   PROJECT VAKTA - DATA-OVER-SOUND WEB SERVER")
    print("=" * 65)
    print(f"\n[1] Testing on the SAME computer (Two tabs / Split view):")
    print(f"    --> http://localhost:{port}")
    print(f"\n[2] Testing across TWO DIFFERENT machines (Laptop/Phone on same Wi-Fi):")
    print(f"    --> http://{local_ip}:{port}")
    print("\n" + "-" * 65)
    print("[!] MICROPHONE SECURITY TIP:")
    print(" * On localhost, browsers grant microphone access immediately.")
    print(" * For a 2nd machine over plain HTTP IP, Edge/Chrome may require adding:")
    print(f"   'http://{local_ip}:{port}' to chrome://flags/#unsafely-treat-insecure-origin-as-secure")
    print("   or test in two tabs / windows on localhost first.")
    print("-" * 65)
    print(f"Serving files from: {script_dir}")
    print("Press Ctrl+C to stop the server.\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Project Vakta server. Goodbye!")
        server.server_close()

if __name__ == '__main__':
    main()
