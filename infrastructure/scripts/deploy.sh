#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Hemaya VMS — Deployment Script
# Usage: ./deploy.sh [staging|production] [--dry-run]
# ─────────────────────────────────────────────────────────────

ENVIRONMENT="${1:-staging}"
DRY_RUN="${2:-}"
REGISTRY="${REGISTRY:-ghcr.io/hemayacontrolroom9-creator}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NAMESPACE="hemaya-vms$([ "$ENVIRONMENT" = "staging" ] && echo "-staging" || echo "")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +%T)] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%T)] WARNING: $1${NC}"; }
fail() { echo -e "${RED}[$(date +%T)] ERROR: $1${NC}"; exit 1; }

[[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]] && \
  fail "Environment must be 'staging' or 'production'"

if [[ "$ENVIRONMENT" == "production" ]]; then
  warn "You are deploying to PRODUCTION. Press CTRL+C within 5 seconds to cancel."
  sleep 5
fi

log "Starting deployment to $ENVIRONMENT (tag: $IMAGE_TAG)"

# Run health check before deployment
log "Running pre-deployment health check..."
bash "$(dirname "$0")/health-check.sh" "$ENVIRONMENT" || fail "Pre-deployment health check failed"

# Apply K8s manifests
OVERLAY_PATH="$(dirname "$0")/../kubernetes/overlays/$ENVIRONMENT"
log "Applying Kubernetes manifests from $OVERLAY_PATH..."

if [[ -n "$DRY_RUN" ]]; then
  kubectl kustomize "$OVERLAY_PATH" | kubectl apply --dry-run=client -f -
  log "Dry-run complete — no changes applied"
  exit 0
fi

# Update image tags
kubectl set image deployment/backend \
  backend="$REGISTRY/hemaya-vms-backend:$IMAGE_TAG" \
  -n "$NAMESPACE" 2>/dev/null || true

kubectl set image deployment/frontend \
  frontend="$REGISTRY/hemaya-vms-frontend:$IMAGE_TAG" \
  -n "$NAMESPACE" 2>/dev/null || true

kubectl kustomize "$OVERLAY_PATH" | kubectl apply -f -

# Wait for rollout
log "Waiting for backend rollout..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s || {
  warn "Backend rollout failed — rolling back..."
  kubectl rollout undo deployment/backend -n "$NAMESPACE"
  fail "Deployment failed and was rolled back"
}

log "Waiting for frontend rollout..."
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=180s || {
  warn "Frontend rollout failed — rolling back..."
  kubectl rollout undo deployment/frontend -n "$NAMESPACE"
  fail "Frontend deployment failed and was rolled back"
}

log "✅ Deployment to $ENVIRONMENT complete!"
log "   Namespace: $NAMESPACE"
log "   Image tag: $IMAGE_TAG"
