#!/bin/sh
echo "=== Starting Keboola Data App Setup ==="

# Find absolute path of node
NODE_BIN=$(command -v node)
echo "Absolute Node path: $NODE_BIN"

# If node is found, replace the command in supervisord configs with the absolute path
if [ -n "$NODE_BIN" ]; then
    echo "Updating supervisord configuration with absolute Node path..."
    # We use sed to replace the command in the config files in /app/keboola-config/
    sed -i "s|command=node server.js|command=$NODE_BIN server.js|g" /app/keboola-config/supervisord/app.conf
    sed -i "s|command=node server.js|command=$NODE_BIN server.js|g" /app/keboola-config/supervisord/services/app.conf
    sed -i "s|command=npm start|command=$NODE_BIN server.js|g" /app/keboola-config/supervisord/app.conf
    sed -i "s|command=npm start|command=$NODE_BIN server.js|g" /app/keboola-config/supervisord/services/app.conf
fi

cd /app/data-app
echo "Installing Express production dependencies..."
npm install --production --legacy-peer-deps

echo "=== Setup Completed successfully! ==="
