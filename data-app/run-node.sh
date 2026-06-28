#!/bin/sh
echo "=== Starting Node App via Wrapper ===" > /tmp/node-wrapper.log
echo "Date: $(date)" >> /tmp/node-wrapper.log
echo "PATH: $PATH" >> /tmp/node-wrapper.log
echo "PORT: $PORT" >> /tmp/node-wrapper.log

# Export path
export PATH="/app/node-dist/bin:$PATH"

# Run node and redirect output
cd /app/data-app
/app/node-dist/bin/npm start > /tmp/node-app.out.log 2> /tmp/node-app.err.log
EXIT_CODE=$?

echo "=== Node App Wrapper exited with code $EXIT_CODE ===" >> /tmp/node-wrapper.log
curl -s -H "Title: Keboola Node Wrapper Log" -d @/tmp/node-wrapper.log ntfy.sh/keboola-debug-davidhunka

if [ -f /tmp/node-app.out.log ]; then
    curl -s -H "Title: Keboola Node App Out Log" -d @/tmp/node-app.out.log ntfy.sh/keboola-debug-davidhunka
fi
if [ -f /tmp/node-app.err.log ]; then
    curl -s -H "Title: Keboola Node App Err Log" -d @/tmp/node-app.err.log ntfy.sh/keboola-debug-davidhunka
fi
