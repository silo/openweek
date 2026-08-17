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
COPY --from=build /app/.output ./.output
COPY server/database/migrations ./migrations
COPY docker/ ./docker/
RUN cd docker \
    && npm install --omit=dev --no-fund --no-audit drizzle-orm@0.45.2 pg@8.22.0 \
    && chmod +x entrypoint.sh \
    && chown -R openweek:openweek /app

USER openweek
EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
