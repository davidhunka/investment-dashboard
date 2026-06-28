#!/bin/bash
echo "=== Starting Node App via Wrapper ===" > /tmp/node-wrapper.log
echo "Date: $(date)" >> /tmp/node-wrapper.log
echo "PATH: $PATH" >> /tmp/node-wrapper.log
echo "PORT: $PORT" >> /tmp/node-wrapper.log

# Define a function to send wrapper logs
send_wrapper_logs() {
    echo "=== Node App Wrapper exited ===" >> /tmp/node-wrapper.log
    curl -s -H "Title: Keboola Node Wrapper Log" -d @/tmp/node-wrapper.log ntfy.sh/keboola-debug-davidhunka
    if [ -f /tmp/node-app.out.log ]; then
        curl -s -H "Title: Keboola Node App Out Log" -d @/tmp/node-app.out.log ntfy.sh/keboola-debug-davidhunka
    fi
    if [ -f /tmp/node-app.err.log ]; then
        curl -s -H "Title: Keboola Node App Err Log" -d @/tmp/node-app.err.log ntfy.sh/keboola-debug-davidhunka
    fi
}

trap send_wrapper_logs EXIT

# Export path
export PATH="/app/node-dist/bin:$PATH"

# Run node and redirect output
cd /app/data-app
/app/node-dist/bin/npm start > >(tee -i /tmp/node-app.out.log) 2> >(tee -i /tmp/node-app.err.log >&2)
