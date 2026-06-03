#!/bin/bash
set -e
echo "=== Starting Keboola Data App Setup ==="
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
cd /app/data-app
echo "Installing Node.js dependencies..."
npm install
echo "Building production bundles..."
npm run build
echo "=== Setup Completed successfully! ==="
