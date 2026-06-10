#!/bin/bash

# Stop the container and clear the anonymous volume cache using the stop-app script
./shells/stop-app.sh dev

# Start the application
./shells/start-app.sh dev &&
echo "Build dev complete...."
