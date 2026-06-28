#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="

# Run everything in a block and redirect output
{
    echo "Date: $(date)"
    echo "User: $(whoami)"
    echo "System architecture: $(uname -m)"
    echo "PATH: $PATH"
    
    # Check if node is available
    if command -v node >/dev/null 2>&1; then
        echo "Preinstalled Node.js found: $(node -v)"
        mkdir -p /app/node-dist/bin
        ln -sf $(command -v node) /app/node-dist/bin/node
        ln -sf $(command -v npm) /app/node-dist/bin/npm
    else
        echo "Node.js not found. Downloading portable Node.js..."
        # Download Node.js binary tarball
        curl -sL https://nodejs.org/dist/v20.12.2/node-v20.12.2-linux-x64.tar.xz -o /tmp/node.tar.xz
        
        echo "Extracting Node.js..."
        mkdir -p /app/node-dist
        tar -xf /tmp/node.tar.xz -C /app/node-dist --strip-components=1
        rm -f /tmp/node.tar.xz
        echo "Node.js installed locally!"
    fi
    
    export PATH="/app/node-dist/bin:$PATH"
    echo "Active Node.js version: $(node -v)"
    echo "Active NPM version: $(npm -v)"
    
    cd /app/data-app
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
    
    echo "Building production bundles..."
    npm run build
    
    echo "=== Setup Completed successfully! ==="
} > /tmp/setup.log 2>&1

# Upload logs to ntfy
curl -s -H "Title: Keboola Setup Log" -d @/tmp/setup.log ntfy.sh/keboola-debug-davidhunka
