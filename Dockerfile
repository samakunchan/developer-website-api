# Stage 1: Install dependencies
FROM node:22-slim AS deps
WORKDIR /app

# Add openssl for Prisma
RUN apt-get update && apt-get install -y openssl

# Copy package management files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Stage 2: Development environment
FROM node:22-slim AS dev
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi
EXPOSE 3002
CMD ["yarn", "nest", "start", "--watch"]

# Stage 3: Build the application
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Build the project (NestJS build)
RUN yarn build

# Stage 4: Production runner
FROM node:22-slim AS runner
WORKDIR /app

# Add openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3002

# Copy necessary files for database initialization and runtime
COPY package.json yarn.lock* ./
COPY tsconfig.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY shells/docker-entrypoint-prod.sh ./entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

# Expose the application port
EXPOSE 3002

# Use the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
