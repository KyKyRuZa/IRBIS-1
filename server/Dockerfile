FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma.config.js ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./
COPY prisma.config.js ./
COPY prisma ./prisma
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
