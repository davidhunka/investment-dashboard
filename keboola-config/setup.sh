#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="
cd /app/data-app
echo "Installing Express production dependencies..."
npm install --production --legacy-peer-deps
echo "=== Setup Completed successfully! ==="
