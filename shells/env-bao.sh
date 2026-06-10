#!/bin/bash

# ==============================================================================
# OpenBao Environment Helper
# This script fetches secrets and sets up DATABASE_URL for local and Docker use.
# Usage: source ./shells/env-bao.sh [dev|stage|prod]
# ==============================================================================

ENV=${1:-dev}

# 1. Configuration (Bootstrap)
BAO_ROLE_ID=""
BAO_SECRET_ID=""
BAO_PATH="secret/data/developer-website"

# If BAO_ROLE_ID or BAO_SECRET_ID are not set, try to load them from .env
if [ -f ".env" ]; then
    if [ -z "$BAO_ROLE_ID" ]; then
        BAO_ROLE_ID=$(grep -E "^BAO_ROLE_ID=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
    if [ -z "$BAO_SECRET_ID" ]; then
        BAO_SECRET_ID=$(grep -E "^BAO_SECRET_ID=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
fi

if [ -z "$BAO_ROLE_ID" ] || [ -z "$BAO_SECRET_ID" ]; then
    echo "❌ Erreur : Les variables BAO_ROLE_ID et BAO_SECRET_ID doivent être renseignées (dans le script ou dans le fichier .env)."
    return 1 2>/dev/null || exit 1
fi

# Adjust BAO_ADDR based on environment and execution context
if [ "$DOCKER" = "true" ]; then
    # Inside Docker on the VPS (same network)
    BAO_ADDR="http://openbao:8200"
elif curl -s --connect-timeout 2 http://localhost:8200/v1/sys/health >/dev/null 2>&1; then
    # If OpenBao is running and accessible on localhost (e.g. running on the VPS itself, or local dev machine)
    BAO_ADDR="http://localhost:8200"
elif [ "$ENV" = "prod" ] || [ "$ENV" = "stage" ]; then
    # Running locally but targeting production/staging (VPS IP)
    BAO_ADDR="$process.env.BAO_ADDR_STAGE_PROD"
else
    # Running locally for local development
    BAO_ADDR="http://localhost:8200"
fi
# 2. Login and Fetch Secrets
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"role_id\":\"$BAO_ROLE_ID\", \"secret_id\":\"$BAO_SECRET_ID\"}" \
  "$BAO_ADDR/v1/auth/approle/login")

TOKEN=$(echo $LOGIN_RES | jq -r .auth.client_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error: Failed to login to OpenBao."
  return 1 2>/dev/null || exit 1
fi

SECRETS_JSON=$(curl -s -H "X-Vault-Token: $TOKEN" "$BAO_ADDR/v1/$BAO_PATH")

# Export all secrets to current shell
eval $(echo $SECRETS_JSON | jq -r '.data.data | to_entries | .[] | "export \(.key)=\"\(.value)\""')

# 3. Construct DATABASE_URL
if [ "$DOCKER" = "true" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@postgresdb:5432/${POSTGRES_DB}?schema=public"
else
    PORT=$([ "$ENV" = "prod" ] || [ "$ENV" = "stage" ] && echo "5436" || echo "5435")
    export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@localhost:${PORT}/${POSTGRES_DB}?schema=public"
fi

# Also export OpenBao details for the app to use
export BAO_ADDR=$BAO_ADDR
export BAO_ROLE_ID=$BAO_ROLE_ID
export BAO_SECRET_ID=$BAO_SECRET_ID
export BAO_PATH=$BAO_PATH
