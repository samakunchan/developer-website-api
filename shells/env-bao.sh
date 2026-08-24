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
BAO_PATH=""

# Load configurations from .env if present (only overrides if the variable is defined in .env to protect production env vars)
if [ -f ".env" ]; then
    if grep -qE "^BAO_ROLE_ID=" .env; then
        BAO_ROLE_ID=$(grep -E "^BAO_ROLE_ID=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
    if grep -qE "^BAO_SECRET_ID=" .env; then
        BAO_SECRET_ID=$(grep -E "^BAO_SECRET_ID=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
    if grep -qE "^BAO_PATH=" .env; then
        BAO_PATH=$(grep -E "^BAO_PATH=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
    if grep -qE "^BAO_ADDR_STAGE_PROD=" .env; then
        BAO_ADDR_STAGE_PROD=$(grep -E "^BAO_ADDR_STAGE_PROD=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
    if grep -qE "^BAO_ADDR=" .env; then
        BAO_ADDR=$(grep -E "^BAO_ADDR=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
fi

if [ -z "$BAO_ROLE_ID" ] || [ -z "$BAO_SECRET_ID" ]; then
    echo "❌ Erreur : Les variables BAO_ROLE_ID et BAO_SECRET_ID doivent être renseignées (dans le script ou dans le fichier .env)."
    return 1 2>/dev/null || exit 1
fi

# Adjust BAO_ADDR based on environment and execution context
if [ "$DOCKER" = "true" ]; then
    # Inside Docker on the VPS (same network)
    BAO_ADDR=${BAO_ADDR:-"http://openbao:8200"}
elif [ "$ENV" = "prod" ] || [ "$ENV" = "stage" ]; then
    # Running on the host targeting production/staging
    BAO_ADDR=${BAO_ADDR_STAGE_PROD:-"http://localhost:8200"}
else
    # Running locally for local development
    BAO_ADDR=${BAO_ADDR:-"http://localhost:8200"}
fi
# 2. Login and Fetch Secrets
LOGIN_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" \
  -d "{\"role_id\":\"$BAO_ROLE_ID\", \"secret_id\":\"$BAO_SECRET_ID\"}" \
  "$BAO_ADDR/v1/auth/approle/login")

HTTP_STATUS=$(echo "$LOGIN_RES" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$LOGIN_RES" | grep -v "HTTP_STATUS")
TOKEN=$(echo "$BODY" | jq -r .auth.client_token 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error: Failed to login to OpenBao."
  echo "   Address attempted: $BAO_ADDR"
  echo "   HTTP Status: $HTTP_STATUS"
  echo "   Response: $BODY"
  return 1 2>/dev/null || exit 1
fi

# 3. Fetch Secrets
SECRETS_JSON_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "X-Vault-Token: $TOKEN" "$BAO_ADDR/v1/$BAO_PATH")

HTTP_STATUS=$(echo "$SECRETS_JSON_RES" | grep "HTTP_STATUS" | cut -d':' -f2)
SECRETS_JSON=$(echo "$SECRETS_JSON_RES" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "❌ Error: Failed to fetch secrets from OpenBao."
  echo "   Address: $BAO_ADDR"
  echo "   Path: $BAO_PATH"
  echo "   HTTP Status: $HTTP_STATUS"
  echo "   Response: $SECRETS_JSON"
  return 1 2>/dev/null || exit 1
fi

# Validate jq output
JQ_TEST=$(echo "$SECRETS_JSON" | jq -r '.data.data' 2>/dev/null)
if [ "$JQ_TEST" = "null" ] || [ -z "$JQ_TEST" ]; then
  echo "❌ Error: Invalid response format from OpenBao or path does not exist."
  echo "   Response: $SECRETS_JSON"
  return 1 2>/dev/null || exit 1
fi

# Export all secrets to current shell
eval $(echo $SECRETS_JSON | jq -r '.data.data | to_entries | .[] | "export \(.key)=\"\(.value)\""')

# 3. Construct DATABASE_URL
if [ "$DOCKER" = "true" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@postgresdb:5432/${POSTGRES_DB}?schema=public"
elif [ "$ENV" = "dev" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@localhost:5435/${POSTGRES_DB}?schema=public"
else
    PORT=$([ "$ENV" = "prod" ] || [ "$ENV" = "stage" ] && echo "5436" || echo "5435")
    export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@localhost:${PORT}/${POSTGRES_DB}?schema=public"
fi

# Also export OpenBao details for the app to use
export BAO_ADDR=$BAO_ADDR
export BAO_ROLE_ID=$BAO_ROLE_ID
export BAO_SECRET_ID=$BAO_SECRET_ID
export BAO_PATH=$BAO_PATH
