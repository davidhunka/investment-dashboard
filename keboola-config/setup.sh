#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="

# Find absolute path of node
NODE_BIN=$(command -v node)
echo "Absolute Node path: $NODE_BIN"

if [ -n "$NODE_BIN" ]; then
    echo "Updating supervisord configuration with absolute Node path..."
    # Replace 'command=node' with 'command=<absolute_node_path>' in services/app.conf
    sed -i "s|command=node|command=$NODE_BIN|g" /app/keboola-config/supervisord/services/app.conf
fi

echo "=== Setup Completed successfully! ==="
