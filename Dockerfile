# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Node sizes its heap at half the memory it can see, which on an unconstrained `docker build`
# is the host's MemTotal — so a busy 2 GB box aims for a 1 GB heap against ~1.2 GB actually
# free and gets OOM-killed. 512 makes it collect instead. Measured; the build needs ~1.2 GB
# either way. See docs/self-hosting.md#building-on-a-small-host.
RUN NODE_OPTIONS=--max-old-space-size=512 pnpm build

# The Nitro bundle carries drizzle-orm and pg tree-shaken — `node-postgres/migrator` is not in
# it — so the migration runner needs its own copy. Resolved here rather than in the runtime
# stage: pnpm's store is already warm from the install above, and both it and the package
# manager are discarded with this stage instead of being baked into the image. Versions come
# from package.json so the two cannot drift apart.
RUN mkdir -p /migrator && cd /migrator && echo '{"private":true}' > package.json \
    && pnpm add --node-linker=hoisted \
       "drizzle-orm@$(node -p "require('/app/package.json').dependencies['drizzle-orm']")" \
       "pg@$(node -p "require('/app/package.json').dependencies.pg")"

# ---- runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
RUN addgroup -S openweek && adduser -S -G openweek openweek

# Self-contained Nitro output + a tiny migration runner (drizzle-orm migrator + the committed SQL).
# --chown on the COPY rather than a later `chown -R`: recursive chown rewrites every file, and
# overlayfs copies each one into a new layer, duplicating .output and node_modules in the image.
COPY --from=build --chown=openweek:openweek /app/.output ./.output
COPY --chown=openweek:openweek server/database/migrations ./migrations
COPY --chown=openweek:openweek --chmod=755 docker/ ./docker/
COPY --from=build --chown=openweek:openweek /migrator/node_modules ./docker/node_modules

USER openweek
EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
