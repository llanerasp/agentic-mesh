FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0

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
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/conversation/package.json ./services/conversation/
COPY services/conversation/prisma ./services/conversation/prisma

# --ignore-scripts evita husky prepare Y prisma generate (no necesitamos
# regenerar el cliente, lo traemos del builder stage).
RUN npm ci --workspaces --include-workspace-root --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/conversation/dist ./services/conversation/dist
# Cliente Prisma pre-generado en el builder.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Prisma CLI necesita cachear engines en runtime. El user `node` debe poder
# escribir en /app/node_modules. chown -R antes de cambiar de usuario.
RUN chown -R node:node /app

USER node
EXPOSE 3002
# Para la demo usamos `db push` (aplica el schema sin historial de migraciones).
# En produccion real se usaria `migrate deploy` con migraciones versionadas.
# --skip-generate: el cliente ya esta copiado del builder.
CMD ["sh", "-c", "npx prisma db push --schema=services/conversation/prisma/schema.prisma --skip-generate --accept-data-loss && node services/conversation/dist/server.js"]
