#!/usr/bin/env bash
set -euo pipefail

namespace="nexo-park"

if [[ "${1:-}" != "--yes" ]]; then
  echo "This deletes the local Kubernetes namespace '$namespace' and its development data."
  echo "Run: bash scripts/k8s-reset-dev.sh --yes"
  exit 1
fi

kubectl delete namespace "$namespace" --ignore-not-found --wait=true
echo "Development namespace removed. Rebuild if needed, then run bash scripts/k8s-deploy.sh."
