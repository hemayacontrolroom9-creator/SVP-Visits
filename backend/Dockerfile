# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /tmp/prod_node_modules
RUN npm ci

# ── Stage 2: Development ──────────────────────────────────────
FROM base AS development
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
EXPOSE 3000 9464
CMD ["npm", "run", "start:dev"]

# ── Stage 3: Builder ──────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 4: Production ───────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=base /tmp/prod_node_modules ./node_modules
# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000 9464

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
