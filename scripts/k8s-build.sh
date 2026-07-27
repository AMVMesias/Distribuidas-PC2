#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

context="$(kubectl config current-context 2>/dev/null || true)"
if [[ "$context" == minikube ]] && command -v minikube >/dev/null 2>&1; then
  eval "$(minikube -p minikube docker-env)"
  echo "Building directly in Minikube's Docker daemon"
fi

images=(
  "nexo-usuarios:local|services/usuarios"
  "nexo-zonas:local|services/zonas"
  "nexo-vehiculos:local|services/vehiculos"
  "nexo-asignaciones:local|services/asignaciones"
  "nexo-tickets:local|services/tickets"
  "nexo-audit:local|services/ms-audit"
  "nexo-frontend:local|frontend"
)

for entry in "${images[@]}"; do
  image="${entry%%|*}"
  context="${entry##*|}"
  echo "Building $image from $context"
  docker build -t "$image" "$context"
done

if [[ "$context" == kind-* ]] && command -v kind >/dev/null 2>&1; then
  cluster="${context#kind-}"
  for entry in "${images[@]}"; do
    kind load docker-image "${entry%%|*}" --name "$cluster"
  done
fi
