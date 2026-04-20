#!/usr/bin/env bash
# Build + load + apply para minikube.
# Uso: bash scripts/deploy-local.sh

set -euo pipefail

PROFILE=${MINIKUBE_PROFILE:-llm-agent}
VERSION=${VERSION:-0.1.0}

echo "==> Minikube profile: $PROFILE"
echo "==> Image version: $VERSION"

# 1. Apuntar docker al daemon de minikube para que las imagenes se queden alli
#    (evita tener que hacer minikube image load por red).
echo "==> Configurando docker env de minikube..."
eval "$(minikube -p "$PROFILE" docker-env)"

# 2. Build de las 3 imagenes desde la raiz del monorepo.
echo "==> Building gateway..."
docker build -f services/gateway/Dockerfile -t "llm-agent/gateway:$VERSION" .

echo "==> Building conversation..."
docker build -f services/conversation/Dockerfile -t "llm-agent/conversation:$VERSION" .

echo "==> Building llm-worker..."
docker build -f services/llm-worker/Dockerfile -t "llm-agent/llm-worker:$VERSION" .

# 3. Activar el addon de ingress (idempotente).
echo "==> Habilitando ingress addon..."
minikube -p "$PROFILE" addons enable ingress || true

# 4. Aplicar los manifests.
echo "==> Aplicando manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/conversation/
kubectl apply -f k8s/llm-worker/
kubectl apply -f k8s/gateway/
kubectl apply -f k8s/ingress.yaml

echo ""
echo "==> Desplegado. Esperando pods..."
kubectl -n llm-agent rollout status statefulset/postgres --timeout=180s
kubectl -n llm-agent rollout status deployment/conversation --timeout=180s
kubectl -n llm-agent rollout status deployment/llm-worker --timeout=180s
kubectl -n llm-agent rollout status deployment/gateway --timeout=180s

echo ""
echo "==> Estado final:"
kubectl -n llm-agent get pods

echo ""
echo "==> Siguiente paso para probar:"
echo "   minikube -p $PROFILE tunnel      # en otra terminal, deja corriendo"
echo "   anyade 'llm-agent.local' al hosts apuntando a 127.0.0.1"
echo "   curl -X POST http://llm-agent.local/chat -H 'Content-Type: application/json' -d '{\"userId\":\"demo\",\"message\":\"Hola\"}'"
