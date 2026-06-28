#!/bin/sh
mkdir -p /data/out/files
echo "=== Starting Node App via Bun ===" > /data/out/files/node_app_run.txt
echo "Date: $(date)" >> /data/out/files/node_app_run.txt
echo "PORT: $PORT" >> /data/out/files/node_app_run.txt

cd /app/data-app
bun server.js >> /data/out/files/node_app_run.txt 2>&1
