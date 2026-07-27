#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

kubectl kustomize deployment >/dev/null
bash -n scripts/k8s-build.sh scripts/k8s-deploy.sh scripts/k8s-status.sh

kubectl create secret generic parking-secrets --namespace nexo-park \
  --from-env-file=.env --dry-run=client -o yaml >/dev/null
kubectl create secret generic jwt-keys --namespace nexo-park \
  --from-file=jwt-private.pem=.secrets/jwt-private.pem \
  --from-file=jwt-public.pem=.secrets/jwt-public.pem \
  --dry-run=client -o yaml >/dev/null
kubectl create configmap kong-config --namespace nexo-park \
  --from-file=kong.yml=infrastructure/kong/kong.yml \
  --dry-run=client -o yaml >/dev/null

docker rm -f nexo-frontend-smoke >/dev/null 2>&1 || true
trap 'docker rm -f nexo-frontend-smoke >/dev/null 2>&1 || true' EXIT
docker run -d --rm --name nexo-frontend-smoke nexo-frontend:local >/dev/null

attempt=0
until docker exec nexo-frontend-smoke wget -qO- http://127.0.0.1:3000/es >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  [[ "$attempt" -lt 30 ]] || { docker logs nexo-frontend-smoke; exit 1; }
  sleep 1
done

echo "Kustomize, generated resources, scripts, and frontend smoke test: OK"
