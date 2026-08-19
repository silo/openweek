# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
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
COPY --chown=openweek:openweek docker/ ./docker/

# The Nitro bundle already carries drizzle-orm and pg, but tree-shaken — `node-postgres/migrator`
# is not in it — so the migration runner needs its own copy. Installed as the app user (npm's
# cache then lands in a directory we own) and the cache is cleared *in the same layer*: left
# behind it bakes ~270 MB into the image, several times the size of everything it installs.
USER openweek
RUN cd docker \
    && npm install --omit=dev --no-fund --no-audit drizzle-orm@0.45.2 pg@8.22.0 \
    && npm cache clean --force \
    && chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
