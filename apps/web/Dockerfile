FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm once
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter=web...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/web ./apps/web
COPY apps/web/next.config.* ./apps/web/

WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
RUN npx next build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy full standalone structure maintaining paths
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/standalone ./
# Copy static files (not included in standalone)
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# Copy public folder
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/public ./apps/web/public

USER nodejs

EXPOSE 3001

CMD ["node", "apps/web/server.js"]
