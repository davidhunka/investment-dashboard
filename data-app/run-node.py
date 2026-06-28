import os
import sys
import subprocess
import urllib.request

LOG_FILE = "/tmp/node-wrapper.log"
NTFY_URL = "https://ntfy.sh/keboola-debug-davidhunka"

def log(msg):
    print(msg)
    sys.stdout.flush()
    try:
        with open(LOG_FILE, "a") as f:
            f.write(str(msg) + "\n")
    except Exception as e:
        print(f"Failed to write log: {e}")

with open(LOG_FILE, "w") as f:
    f.write("=== Starting Node App via Python Wrapper ===\n")

try:
    os.environ["PATH"] = f"/app/node-dist/bin:{os.environ.get('PATH')}"
    os.chdir("/app/data-app")
    
    # Run npm start and capture output
    # We want to run it and write stdout/stderr to files so we can send them
    out_file = open("/tmp/node-app.out.log", "w")
    err_file = open("/tmp/node-app.err.log", "w")
    
    log("Starting npm start process...")
    proc = subprocess.Popen(
        ["/app/node-dist/bin/npm", "start"],
        stdout=out_file,
        stderr=err_file,
        env=os.environ
    )
    
    # Wait for process to exit
    exit_code = proc.wait()
    log(f"Node process exited with code {exit_code}")
    out_file.close()
    err_file.close()

except Exception as e:
    log(f"🔥 EXCEPTION in run-node.py: {e}")

finally:
    # Send wrapper logs
    try:
        with open(LOG_FILE, "r") as f:
            log_data = f.read().encode("utf-8")
        req = urllib.request.Request(
            NTFY_URL,
            data=log_data,
            headers={"Title": "Keboola Node Wrapper Log"}
        )
        urllib.request.urlopen(req)
        
        # Send stderr logs if they exist
        if os.path.exists("/tmp/node-app.err.log"):
            with open("/tmp/node-app.err.log", "r") as f:
                err_data = f.read().encode("utf-8")
            req = urllib.request.Request(
                NTFY_URL,
                data=err_data,
                headers={"Title": "Keboola Node App Err Log"}
            )
            urllib.request.urlopen(req)
    except Exception as telemetry_error:
        print(f"Failed to send telemetry: {telemetry_error}")
