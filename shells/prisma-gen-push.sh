#!/bin/bash

# Determine environment (default to dev)
ENV=${1:-dev}

if [ "$ENV" = "prod" ]; then
    ENV_FILE="docker-prod.env"
    echo "🚀 Targeting PRODUCTION database (Port 5436)..."
else
    ENV_FILE="docker.env"
    echo "🛠️ Targeting DEVELOPMENT database (Port 5435)..."
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found."
    exit 1
fi

# Load variables from the environment file
# We use grep to ignore comments and xargs to export them
export $(grep -v '^#' $ENV_FILE | xargs)

# Construct DATABASE_URL for host-to-container access
# We use localhost because we are running from the host machine, and the external port mapped in docker
export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT_EXTERNAL}/${POSTGRES_DB}?schema=public"

# Run Prisma commands
yarn prisma generate
yarn prisma db push
