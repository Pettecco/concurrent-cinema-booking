FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm once
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter=api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN npx tsc

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/knexfile.ts ./apps/api/knexfile.ts
COPY --from=builder /app/apps/api/src/infra ./apps/api/src/infra
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api

RUN chmod +x docker-entrypoint.sh && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
