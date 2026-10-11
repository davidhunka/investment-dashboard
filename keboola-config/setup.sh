#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="

# Try running node server in background to see if it starts successfully
echo "=== Starting Node Server Diagnostic Test ==="
PORT=3000 node /app/data-app/server.js > /tmp/diag_node.log 2>&1 &
NODE_PID=$!

echo "Waiting 5 seconds for server to boot..."
sleep 5

echo "Checking if Node server is running (PID: $NODE_PID)..."
if kill -0 $NODE_PID 2>/dev/null; then
    echo "Node server is running. Checking response..."
    curl -i http://127.0.0.1:3000/
    echo "Stopping test server..."
    kill $NODE_PID
else
    echo "❌ Node server CRASHED during startup! Printing logs:"
    cat /tmp/diag_node.log
fi
echo "=== Diagnostic Test Completed ==="

# Find absolute path of node
NODE_BIN=$(command -v node)
echo "Absolute Node path: $NODE_BIN"

if [ -n "$NODE_BIN" ]; then
    echo "Updating supervisord configuration with absolute Node path..."
    sed -i "s|command=node|command=$NODE_BIN|g" /app/keboola-config/supervisord/services/app.conf
fi

echo "=== Setup Completed successfully! ==="
