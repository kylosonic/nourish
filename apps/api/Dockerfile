# API image (CI / deployment path). Dev runs bare-node (README.md).
# Prisma needs openssl; alpine keeps the image small.
# Node 22 is the latest LTS with reliable Prisma support.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
EXPOSE 3000
# Prisma migrations run before app start; the deploy safely skips
# migrations already applied, so zero-downtime on non-breaking changes.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
