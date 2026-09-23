# syntax=docker/dockerfile:1
# NOTE: This file is NOT used in production. The nginx/Dockerfile builds the client
# and serves the static build. This file remains for local dev reference only.

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 5173
