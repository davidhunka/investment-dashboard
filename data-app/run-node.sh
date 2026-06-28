#!/bin/sh
if command -v python3 >/dev/null 2>&1; then
    python3 /app/data-app/run-node.py
elif command -v python >/dev/null 2>&1; then
    python /app/data-app/run-node.py
else
    echo "Python not found! Cannot execute run-node.py"
    exit 1
fi
