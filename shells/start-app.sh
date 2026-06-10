#!/bin/bash

# ==============================================================================
# OpenBao Bootstrap Script
# Usage: ./start-app.sh [dev|stage|prod]
# ==============================================================================

ENV=${1:-dev}
PROJECT_NAME="developer-website-api-$ENV"
COMPOSE_FILES="-f compose.yml"

if [ "$ENV" = "dev" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f compose-dev.yml"
elif [ "$ENV" = "stage" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f compose-stage.yml"
elif [ "$ENV" = "prod" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f compose-prod.yml"
else
  echo "❌ Unknown environment: $ENV. Use 'dev', 'stage' or 'prod'."
  exit 1
fi

# Load environment from OpenBao
source ./shells/env-bao.sh $ENV
if [ $? -ne 0 ]; then
  echo "❌ Aborting: Failed to load environment variables from OpenBao."
  exit 1
fi

# Launch Docker Compose
echo "🚀 [Docker] Starting services for $PROJECT_NAME..."
# Start all services
docker compose -p $PROJECT_NAME $COMPOSE_FILES up -d --build


echo "✨ Application ($ENV) is starting!"
