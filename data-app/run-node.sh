#!/bin/sh
mkdir -p /data/out/files
echo "=== Starting Node App ===" > /data/out/files/node_app_run.txt
echo "Date: $(date)" >> /data/out/files/node_app_run.txt
echo "PORT: $PORT" >> /data/out/files/node_app_run.txt

cd /app/data-app
npm start >> /data/out/files/node_app_run.txt 2>&1
