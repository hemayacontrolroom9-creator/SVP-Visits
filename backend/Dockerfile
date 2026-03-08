# ── Stage 1: Dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# ── Stage 2: Development ─────────────────────────────────────
FROM deps AS development
WORKDIR /app
COPY . .
EXPOSE 3000 9464
CMD ["npm", "run", "start:dev"]

# ── Stage 3: Builder ─────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build
# Prune dev dependencies
RUN npm prune --production

# ── Stage 4: Production ──────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache curl dumb-init
WORKDIR /app
ENV NODE_ENV=production

# Copy pruned deps and build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000 9464

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -fsS http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
