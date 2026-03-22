FROM oven/bun:1.2-slim AS base
WORKDIR /app
RUN bun install -g pnpm@10.32.0

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/website/package.json ./apps/website/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN bun run build

FROM base AS release
RUN mkdir -p /app && chown -R bun:bun /app
USER bun

COPY --from=builder --chown=bun:bun /app/apps/website/build ./app
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/packages ./packages
COPY --from=builder --chown=bun:bun /app/packages/db/migrations ./migrations

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "run", "./app/index.js"]
