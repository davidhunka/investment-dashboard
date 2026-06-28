#!/bin/sh
if command -v python3 >/dev/null 2>&1; then
    python3 /app/keboola-config/setup.py
elif command -v python >/dev/null 2>&1; then
    python /app/keboola-config/setup.py
else
    echo "Python not found! Cannot execute setup.py"
    exit 1
fi
