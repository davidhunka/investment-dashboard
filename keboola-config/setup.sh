#!/bin/bash
echo "=== Starting Keboola Data App Setup ==="

# Check architecture
ARCH=$(uname -m)
echo "System architecture: $ARCH"

# Create a local bin directory
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
    curl -sL https://nodejs.org/dist/v20.12.2/node-v20.12.2-linux-x64.tar.xz -o /tmp/node.tar.xz
    
    # Extract to node-dist
    echo "Extracting Node.js..."
    tar -xf /tmp/node.tar.xz -C /app/node-dist --strip-components=1
    rm /tmp/node.tar.xz
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
