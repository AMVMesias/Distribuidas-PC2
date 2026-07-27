#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

for file in .env .secrets/jwt-private.pem .secrets/jwt-public.pem; do
  [[ -f "$file" ]] || { echo "Missing required file: $file" >&2; exit 1; }
done

kubectl config current-context >/dev/null
kubectl apply -f k8s/1-namespace.yaml

kubectl create secret generic parking-secrets \
  --namespace nexo-park \
  --from-env-file=.env \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic jwt-keys \
  --namespace nexo-park \
  --from-file=jwt-private.pem=.secrets/jwt-private.pem \
  --from-file=jwt-public.pem=.secrets/jwt-public.pem \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap kong-config \
  --namespace nexo-park \
  --from-file=kong.yml=infrastructure/kong/kong.yml \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -k k8s
kubectl get pods,svc,ingress,pvc -n nexo-park

echo "Deployment submitted. Add nexo.local to your hosts file using the ingress address."
