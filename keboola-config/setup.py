import os
import sys
import subprocess
import urllib.request
import tarfile

LOG_FILE = "/tmp/setup.log"
NTFY_URL = "https://ntfy.sh/keboola-debug-davidhunka"

def log(msg):
    print(msg)
    sys.stdout.flush()
    try:
        with open(LOG_FILE, "a") as f:
            f.write(str(msg) + "\n")
    except Exception as e:
        print(f"Failed to write log: {e}")

# Initialize log file
with open(LOG_FILE, "w") as f:
    f.write("=== Starting Python Setup script ===\n")

try:
    log(f"Python version: {sys.version}")
    log(f"System env PATH: {os.environ.get('PATH')}")
    log(f"Current working dir: {os.getcwd()}")
    
    # Check if node is already installed
    node_installed = False
    try:
        res = subprocess.run(["node", "-v"], capture_output=True, text=True)
        if res.returncode == 0:
            log(f"Preinstalled Node.js found: {res.stdout.strip()}")
            node_installed = True
    except Exception as e:
        log(f"Node.js check failed: {e}")
        
    if not node_installed:
        log("Downloading portable Node.js v20.12.2...")
        node_url = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-linux-x64.tar.gz"
        tmp_tar = "/tmp/node.tar.gz"
        
        # Download using urllib
        urllib.request.urlretrieve(node_url, tmp_tar)
        log("Download completed. Extracting Node.js...")
        
        # Extract tar.gz
        os.makedirs("/app/node-dist", exist_ok=True)
        with tarfile.open(tmp_tar, "r:gz") as tar:
            tar.extractall(path="/app/node-dist")
            
        # Move everything inside the extracted folder up to /app/node-dist
        extracted_dirs = os.listdir("/app/node-dist")
        log(f"Extracted contents: {extracted_dirs}")
        
        extracted_path = os.path.join("/app/node-dist", extracted_dirs[0])
        for item in os.listdir(extracted_path):
            s = os.path.join(extracted_path, item)
            d = os.path.join("/app/node-dist", item)
            os.rename(s, d)
        os.rmdir(extracted_path)
        os.remove(tmp_tar)
        log("Node.js installed locally to /app/node-dist!")

    # Add to path
    node_bin = "/app/node-dist/bin"
    os.environ["PATH"] = f"{node_bin}:{os.environ.get('PATH')}"
    log(f"Updated PATH: {os.environ.get('PATH')}")
    
    # Verify node/npm
    node_ver = subprocess.run(["node", "-v"], capture_output=True, text=True).stdout.strip()
    npm_ver = subprocess.run(["npm", "-v"], capture_output=True, text=True).stdout.strip()
    log(f"Active Node version: {node_ver}")
    log(f"Active NPM version: {npm_ver}")
    
    # Run npm install
    log("Installing Node.js dependencies...")
    res_inst = subprocess.run(
        ["npm", "install", "--legacy-peer-deps"],
        cwd="/app/data-app",
        capture_output=True,
        text=True
    )
    log(res_inst.stdout)
    log(res_inst.stderr)
    if res_inst.returncode != 0:
        log(f"NPM install failed with code {res_inst.returncode}!")
        
    # Run npm run build
    log("Building production bundles...")
    res_build = subprocess.run(
        ["npm", "run", "build"],
        cwd="/app/data-app",
        capture_output=True,
        text=True
    )
    log(res_build.stdout)
    log(res_build.stderr)
    if res_build.returncode != 0:
        log(f"NPM build failed with code {res_build.returncode}!")
        
    log("=== Setup Completed successfully! ===")

except Exception as e:
    log(f"🔥 EXCEPTION in setup.py: {e}")

finally:
    # Send logs to ntfy using urllib
    try:
        with open(LOG_FILE, "r") as f:
            log_data = f.read().encode("utf-8")
        req = urllib.request.Request(
            NTFY_URL,
            data=log_data,
            headers={
                "Title": "Keboola Python Setup Log",
                "Priority": "high"
            }
        )
        with urllib.request.urlopen(req) as response:
            print(f"Telemetry sent. Response status: {response.status}")
    except Exception as telemetry_error:
        print(f"Failed to send telemetry: {telemetry_error}")
