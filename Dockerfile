# Multi-Stage Dockerfile for TimeSwap Monorepo Applications
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@11.24.0

# Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

# Builder Stage
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm --filter @timeswap/database db:generate
RUN pnpm build

# Production Runner Base Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@11.24.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

EXPOSE 4000 3000

CMD ["node", "apps/api/dist/main.js"]
