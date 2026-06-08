#!/bin/bash

# Colors
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

printf "${BLUE}Deleting prisma migrations...${NC}\n"
rm -rf prisma/migrations
printf "\n\n"

# Load environment from OpenBao
source ./shells/env-bao.sh $1


printf "${BLUE}Resetting database...${NC}\n"
yarn prisma migrate reset --force --schema=prisma/schema.prisma && 
printf "\n\n"

printf "${GREEN}Database reset complete...${NC}\n"
printf "${BLUE}Migrating database...${NC}\n"
yarn prisma migrate dev --name init_auth --schema=prisma/schema.prisma
printf "\n\n"

printf "${GREEN}Database migrated complete...${NC}\n"
printf "${BLUE}Seeding database...${NC}\n"
yarn tsx prisma/seed.ts
printf "\n\n"

printf "${GREEN}Database seeded complete...${NC}\n"
printf "${ORANGE}Database reset, migrated and seeded complete...${NC}\n"