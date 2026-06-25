# syntax=docker/dockerfile:1

# --- Base: pnpm via corepack ---
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# --- Dependencies (full, for the build) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# --- Build the Nuxt/Nitro output ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# --- Production deps only (for the runtime migrate script) ---
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# --- Runner: Nitro server + migrate-on-start ---
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
COPY --from=prod-deps /app/node_modules ./node_modules
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY package.json ./
EXPOSE 3000
ENV NITRO_HOST=0.0.0.0 NITRO_PORT=3000
# Apply migrations, then start the server (single-container deployment target).
CMD ["sh", "-c", "node scripts/migrate.mjs && node .output/server/index.mjs"]
