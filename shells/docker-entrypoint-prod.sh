#!/bin/sh
set -e

echo "🚀 Starting Production Entrypoint..."

# Ensure we are in the app directory
cd /app

# Construct DATABASE_URL from available environment variables
# Note: Docker's env_file doesn't support interpolation, so we do it here.
export DATABASE_URL="postgresql://${POSTGRES_USER_ENCODED}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT_INTERNAL}/${POSTGRES_DB}?schema=public"

# Run Prisma schema push
echo "🔄 Synchronizing database schema..."
yarn prisma db push --accept-data-loss --url "$DATABASE_URL"

# Run Database seeding
echo "🌱 Seeding database..."
# We use tsx from node_modules if available, or npx prisma db seed if configured in package.json
if [ "$NODE_ENV" = "staging" ] && [ -f "prisma/seed-stage.ts" ]; then
    yarn tsx prisma/seed-trigger.ts
    yarn tsx prisma/seed-stage.ts
elif [ -f "prisma/seed-prod.ts" ]; then
    yarn tsx prisma/seed-trigger.ts
    yarn tsx prisma/seed-prod.ts
fi

echo "✅ Database initialization complete."

# Start the application
echo "📡 Starting Nitro server..."
exec node .output/server/index.mjs
