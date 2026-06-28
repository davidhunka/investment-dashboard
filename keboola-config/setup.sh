#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="
cd /app/data-app
echo "Installing Node.js dependencies..."
npm install --legacy-peer-deps
echo "Building production bundles..."
npm run build
echo "=== Setup Completed successfully! ==="
