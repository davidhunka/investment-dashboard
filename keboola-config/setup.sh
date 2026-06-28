#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="

# Create output directories
mkdir -p /data/out/files

# Write debug info
echo "Date: $(date)" > /data/out/files/bun_version.txt
echo "Bun version: $(bun -v 2>&1)" >> /data/out/files/bun_version.txt
echo "Node version: $(node -v 2>&1)" >> /data/out/files/bun_version.txt
echo "PATH: $PATH" >> /data/out/files/bun_version.txt

cd /app/data-app
echo "Installing dependencies..." >> /data/out/files/bun_version.txt
bun install >> /data/out/files/bun_version.txt 2>&1
echo "Building production bundles..." >> /data/out/files/bun_version.txt
bun run build >> /data/out/files/bun_version.txt 2>&1

echo "=== Setup Completed successfully! ===" >> /data/out/files/bun_version.txt
