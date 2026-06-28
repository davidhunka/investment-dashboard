#!/bin/bash

# Define a function to send logs
send_logs() {
    echo "=== Sending setup logs to ntfy.sh ===" >> /tmp/setup.log
    curl -s -H "Title: Keboola Setup Log" -d @/tmp/setup.log ntfy.sh/keboola-debug-davidhunka
}

# Trap exit to always send logs
trap send_logs EXIT

# Redirect all stdout and stderr of the following commands to /tmp/setup.log and print them to console as well
exec > >(tee -i /tmp/setup.log) 2>&1

echo "=== Starting Keboola Data App Setup ==="

# Check architecture and system info
echo "Date: $(date)"
echo "User: $(whoami)"
echo "System architecture: $(uname -m)"
echo "PATH: $PATH"

# Create local node-dist directory
mkdir -p /app/node-dist

# Check if node is already installed
if command -v node >/dev/null 2>&1; then
    echo "Preinstalled Node.js found: $(node -v)"
    # Symlink existing node to our node-dist/bin to keep PATH uniform
    mkdir -p /app/node-dist/bin
    ln -sf $(command -v node) /app/node-dist/bin/node
    ln -sf $(command -v npm) /app/node-dist/bin/npm
else
    echo "Node.js not found. Downloading portable Node.js v20.12.2 for Linux x64..."
    # Download Node.js binary tarball
    if curl -sL https://nodejs.org/dist/v20.12.2/node-v20.12.2-linux-x64.tar.xz -o /tmp/node.tar.xz; then
        echo "Download successful."
    else
        echo "Download failed!"
        exit 1
    fi
    
    # Extract to node-dist
    echo "Extracting Node.js..."
    if tar -xf /tmp/node.tar.xz -C /app/node-dist --strip-components=1; then
        echo "Extraction successful."
    else
        echo "Extraction failed!"
        exit 1
    fi
    rm -f /tmp/node.tar.xz
    echo "Node.js installed locally!"
fi

# Export PATH so that setup.sh can use node/npm
export PATH="/app/node-dist/bin:$PATH"
echo "Active Node.js version: $(node -v)"
echo "Active NPM version: $(npm -v)"

cd /app/data-app
echo "Installing Node.js dependencies..."
npm install --legacy-peer-deps

echo "Building production bundles..."
npm run build

echo "=== Setup Completed successfully! ==="
