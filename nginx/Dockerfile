# syntax=docker/dockerfile:1

# 1) Build the client (Vite -> dist/)
FROM node:24-alpine AS client-build
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY client/ ./
RUN npm run build

# 2) Serve the static build with nginx + API proxy
FROM nginx:alpine
COPY --from=client-build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
