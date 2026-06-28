import os
import sys
import subprocess
import urllib.request
import json
import time

STORAGE_TOKEN = "67-324-tgyGN1yOzYuKF6DfZ5gXLzsCHE2o5VRj16tacaGW"
API_URL = "https://connection.north-europe.azure.keboola.com/v2/storage/events"

diag_logs = []

def log_to_keboola(message, status="info"):
    formatted = f"[{status.upper()}] {message}"
    print(formatted)
    sys.stdout.flush()
    diag_logs.append(formatted)
    
    # Still attempt to log to Storage events just in case resolving the URL works
    try:
        req = urllib.request.Request(
            API_URL,
            data=json.dumps({
                "component": "keboola.data-apps",
                "message": f"[CONTAINER DEBUG] {message}",
                "type": status
            }).encode("utf-8"),
            headers={
                "X-StorageApi-Token": STORAGE_TOKEN,
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=2) as response:
            pass
    except Exception:
        pass

log_to_keboola("Starting debug diagnostics inside container setup.py...")

try:
    log_to_keboola(f"Python version: {sys.version}")
    log_to_keboola(f"Current Directory: {os.getcwd()}")
    log_to_keboola(f"PATH Env: {os.environ.get('PATH')}")
    
    # 1. Check Node/NPM availability
    node_path = None
    for p in ["node", "/usr/bin/node", "/usr/local/bin/node", "/opt/node/bin/node"]:
        try:
            res = subprocess.run([p, "-v"], capture_output=True, text=True)
            if res.returncode == 0:
                log_to_keboola(f"Found node at {p}: {res.stdout.strip()}")
                node_path = p
                break
        except Exception:
            pass
            
    if not node_path:
        log_to_keboola("Node.js not found in any standard paths!", "error")
    else:
        # 2. Try running server.js in background
        os.chdir("/app/data-app")
        log_to_keboola("Starting server.js in background...")
        
        proc = subprocess.Popen(
            [node_path, "server.js"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=dict(os.environ, PORT="3000", NODE_ENV="production")
        )
        
        # Wait 6 seconds
        time.sleep(6)
        
        # Check if process is still running
        poll = proc.poll()
        if poll is None:
            log_to_keboola("Node server.js is STILL RUNNING successfully in background after 6 seconds!")
            # Terminate it so it doesn't block the port
            proc.terminate()
        else:
            stdout, stderr = proc.communicate()
            log_to_keboola(f"Node server.js CRASHED immediately with code {poll}!", "error")
            log_to_keboola(f"STDOUT: {stdout}", "error")
            log_to_keboola(f"STDERR: {stderr}", "error")
        
except Exception as e:
    log_to_keboola(f"Exception in setup.py: {e}", "error")

log_to_keboola("Setup diagnostics completed. Writing log file to output storage...")

# Write logs to diag_output.txt for output mapping
try:
    os.makedirs("/data/out/files", exist_ok=True)
    with open("/data/out/files/diag_output.txt", "w") as f:
        f.write("\n".join(diag_logs))
    print("Successfully wrote diag_output.txt to /data/out/files/")
except Exception as e:
    print(f"Failed to write log file: {e}")
