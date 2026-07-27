#!/usr/bin/env bash
set -euo pipefail

namespace="${1:-nexo-park}"
kubectl get pods,svc,ingress,pvc -n "$namespace"
echo
kubectl get events -n "$namespace" --sort-by=.lastTimestamp | tail -n 20
