FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/llm-worker/package.json ./services/llm-worker/

RUN npm ci --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY services/llm-worker ./services/llm-worker

RUN npm run build -w @llm-agent/shared
RUN npm run build -w @llm-agent/llm-worker

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/llm-worker/package.json ./services/llm-worker/

RUN npm ci --workspaces --include-workspace-root --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/llm-worker/dist ./services/llm-worker/dist

USER node
EXPOSE 3003
CMD ["node", "services/llm-worker/dist/server.js"]
