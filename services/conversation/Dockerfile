FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/conversation/package.json ./services/conversation/
COPY services/conversation/prisma ./services/conversation/prisma

# postinstall de conversation corre `prisma generate`.
RUN npm ci --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY services/conversation ./services/conversation

RUN npm run build -w @llm-agent/shared
RUN npm run build -w @llm-agent/conversation

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/conversation/package.json ./services/conversation/
COPY services/conversation/prisma ./services/conversation/prisma

RUN npm ci --workspaces --include-workspace-root --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/conversation/dist ./services/conversation/dist

USER node
EXPOSE 3001
# Ejecuta migraciones al arrancar y luego lanza el servidor.
CMD ["sh", "-c", "npx prisma migrate deploy --schema=services/conversation/prisma/schema.prisma && node services/conversation/dist/server.js"]
