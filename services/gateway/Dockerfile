# Multi-stage build para gateway.
# Build stage compila TS; production stage solo lleva el dist y las deps de runtime.

FROM node:20-alpine AS builder
WORKDIR /app
# Saltar el prepare script de husky (no existe en prod).
ENV HUSKY=0

# Copiar manifiestos para cachear install.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/gateway/package.json ./services/gateway/

# Instalar TODAS las deps (incluyendo dev para compilar).
RUN npm ci --workspaces --include-workspace-root

# Copiar codigo fuente.
COPY packages/shared ./packages/shared
COPY services/gateway ./services/gateway

# Compilar shared + gateway.
RUN npm run build -w @llm-agent/shared
RUN npm run build -w @llm-agent/gateway

# ---------- Stage de produccion ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0

# Copiar solo lo necesario.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/gateway/package.json ./services/gateway/

# Instalar solo deps de produccion.
# --ignore-scripts evita lifecycle scripts (ej. husky prepare) que dependen de devDeps.
RUN npm ci --workspaces --include-workspace-root --omit=dev --ignore-scripts

# Copiar los bundles compilados.
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/gateway/dist ./services/gateway/dist

# Arranque.
USER node
EXPOSE 3000
CMD ["node", "services/gateway/dist/server.js"]
