# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# The build peaks at ~1.05 GB RSS — measured, on this app and this base image. Vite 8 (which
# arrived with Nuxt 4.5) costs about 240 MB over Vite 7, so a 1 GB host that used to squeak
# through now needs swap to lean on; see docs/tech-stack.md.
#
# Nothing here is tunable around that. V8's own default ceiling — half the memory it can see,
# 560 MB in a 1 GB box against a build that needs just over 500 — is already the right size,
# and raising it only trades a readable "JavaScript heap out of memory" for the kernel's OOM
# killer at the same wall. Below that, though, the default is *guaranteed* to fail, so there
# the ceiling is forced up and the overflow goes to swap.
#
# What a small host gets either way is a straight answer, before and after. Left alone, the
# failure reaches the deploy log as a bare `exit code: 1`, with the actual error hundreds of
# lines up — which is why this keeps being reported as a mystery.
RUN limit=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo max) ; \
    case "$limit" in \
      ''|max|*[!0-9]*) limit=$(awk '/^MemTotal:/ { print $2 * 1024 }' /proc/meminfo) ;; \
    esac ; \
    mb=$(( limit / 1048576 )) ; \
    swap=$(awk '/^SwapTotal:/ { print int($2 / 1024) }' /proc/meminfo 2>/dev/null || echo 0) ; \
    echo "openweek: building with ${mb} MB of memory and ${swap:-0} MB of swap; this build peaks at ~1050 MB" ; \
    if [ "$mb" -lt 1200 ] && [ "${swap:-0}" -lt 512 ]; then \
      echo "openweek: WARNING — that is not enough, and there is no swap to fall back on." ; \
      echo "openweek: Expect this to fail. docs/self-hosting.md#building-on-a-small-host has" ; \
      echo "openweek: a three-line swapfile recipe, and a way to build this elsewhere instead." ; \
    fi ; \
    if [ "$mb" -ge 950 ]; then \
      pnpm build ; ok=$? ; \
    else \
      echo "openweek: too small for V8's default ceiling (~$(( mb / 2 )) MB), which would fail" ; \
      echo "openweek: outright — asking for 640 MB instead, which needs swap to land." ; \
      NODE_OPTIONS=--max-old-space-size=640 pnpm build ; ok=$? ; \
    fi ; \
    if [ "$ok" -ne 0 ]; then \
      echo "" ; \
      echo "openweek: BUILD FAILED — on ${mb} MB with ${swap:-0} MB swap, memory is the likely reason." ; \
      echo "  Look up the log for 'JavaScript heap out of memory' (ran out of heap) or for" ; \
      echo "  the step ending at 'Killed' (ran out of RAM). Either way: add swap, or build" ; \
      echo "  the image on a bigger machine and pull it here." ; \
      echo "  Both are written up in docs/self-hosting.md#building-on-a-small-host." ; \
      exit 1 ; \
    fi

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
COPY --chown=openweek:openweek docker/ ./docker/

# The Nitro bundle already carries drizzle-orm and pg, but tree-shaken — `node-postgres/migrator`
# is not in it — so the migration runner needs its own copy. Installed as the app user (npm's
# cache then lands in a directory we own) and the cache is cleared *in the same layer*: left
# behind it bakes ~270 MB into the image, several times the size of everything it installs.
USER openweek
RUN cd docker \
    && npm install --omit=dev --no-fund --no-audit drizzle-orm@0.45.2 pg@8.23.0 \
    && npm cache clean --force \
    && chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
