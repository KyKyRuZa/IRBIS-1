# syntax=docker/dockerfile:1
FROM node:24-alpine

WORKDIR /app

# Lockfile + manifests first -> install layer is cached unless deps change
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
