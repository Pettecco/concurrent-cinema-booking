FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN npm install -g pnpm && pnpm install --frozen-lockfile --filter=api...

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

WORKDIR /app/apps/api
RUN npx tsc --noEmit

FROM base AS runner
WORKDIR /app/apps/api

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/knexfile.ts ./knexfile.ts
COPY --from=builder /app/apps/api/src/infra/postgres ./src/infra/postgres

EXPOSE 3000

CMD ["node", "dist/server.js"]
