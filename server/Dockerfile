# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app

# Manifests first -> install layer cached unless deps change
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Schema + config after install so code changes don't invalidate node_modules
COPY prisma.config.js ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    ./node_modules/.bin/prisma generate

# Drop dev deps (prisma CLI, tsx, nodemon...) from the final node_modules
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json package-lock.json ./
COPY prisma.config.js ./
COPY prisma ./prisma
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN apk add --no-cache su-exec && chmod +x docker-entrypoint.sh
EXPOSE 5000
ENV NODE_ENV=production
ENTRYPOINT ["./docker-entrypoint.sh"]
