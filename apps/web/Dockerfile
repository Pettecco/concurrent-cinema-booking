FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN npm install -g pnpm && pnpm install --frozen-lockfile --filter=web...

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

WORKDIR /app/apps/web
RUN npx next build

FROM base AS runner
WORKDIR /app/apps/web

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3001

CMD ["node", "server.js"]
