#!/bin/sh
set -e

echo "🚀 Starting Production Entrypoint..."

# Ensure we are in the app directory
cd /app

# Construct DATABASE_URL from available environment variables
# Note: Docker's env_file doesn't support interpolation, so we do it here.
# Inside Docker, container-to-container communication with the 'postgresdb' service must use the internal port 5432.
if [ "$POSTGRES_HOST" = "postgresdb" ]; then
    DB_PORT="5432"
else
    DB_PORT=${POSTGRES_PORT_INTERNAL:-5432}
fi
export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${DB_PORT}/${POSTGRES_DB}?schema=public"

# Start the application
echo "📡 Starting NestJS server..."
exec node dist/main.js

