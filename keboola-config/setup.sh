#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="

# Create output directories
mkdir -p /data/out/files

# Write debug info
echo "Date: $(date)" > /data/out/files/node_version.txt
echo "Node: $(node -v 2>&1)" >> /data/out/files/node_version.txt
echo "NPM: $(npm -v 2>&1)" >> /data/out/files/node_version.txt
echo "Python: $(python3 -V 2>&1 || python -V 2>&1)" >> /data/out/files/node_version.txt

cd /app/data-app
echo "Installing Node.js dependencies..."
npm install --legacy-peer-deps >> /data/out/files/node_version.txt 2>&1
echo "Building production bundles..."
npm run build >> /data/out/files/node_version.txt 2>&1

echo "=== Setup Completed successfully! ==="
