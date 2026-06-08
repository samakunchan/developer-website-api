#!/bin/bash

# ==============================================================================
# Prisma Seed Script (OpenBao Version)
# Usage: ./shells/prisma-seed.sh [dev|stage|prod]
# ==============================================================================

# Load environment from OpenBao
source ./shells/env-bao.sh $1

echo "🌱 Starting database seed ($ENV)..."

# Run triggers
yarn tsx prisma/seed-trigger.ts

# Run messages seed
yarn tsx prisma/seed-test-messages.ts

# Run main seed
yarn tsx prisma/seed.ts

echo "✅ Seeding complete!"
