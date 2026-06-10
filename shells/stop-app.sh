#!/bin/bash

# ==============================================================================
# OpenBao Stop Script
# Usage: ./shells/stop-app.sh [dev|stage|prod]
# ==============================================================================

ENV=${1:-dev}
PROJECT_NAME="developer-website-api-$ENV"
COMPOSE_FILES="-f compose.yml"

if [ "$ENV" == "dev" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f compose-dev.yml"
elif [ "$ENV" == "stage" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f compose-stage.yml"
elif [ "$ENV" == "prod" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f compose-prod.yml"
fi

# Load environment from OpenBao (to avoid warnings about empty variables)
# We use '|| true' because even if OpenBao is down, we want to try stopping the containers
source ./shells/env-bao.sh $ENV || echo "⚠️ Could not reach OpenBao, stopping with empty vars..."

echo "🛑 [Docker] Stopping services for $PROJECT_NAME..."
if [ "$ENV" == "dev" ]; then
  # Stop and remove the API container in dev
  docker compose -p $PROJECT_NAME $COMPOSE_FILES down
else
  # Stop and remove everything (staging/production) including volumes
  docker compose -p $PROJECT_NAME $COMPOSE_FILES down -v
fi


echo "✅ Done."
