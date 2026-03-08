#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Hemaya VMS — Health Check Script
# Usage: ./health-check.sh [staging|production]
# ─────────────────────────────────────────────────────────────

ENV="${1:-staging}"
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0

check() {
  local name="$1"; local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    echo -e "${GREEN}  ✓ $name${NC}"
    ((PASS++))
  else
    echo -e "${RED}  ✗ $name${NC}"
    ((FAIL++))
  fi
}

URLS=(
  "staging:https://staging.hemaya-vms.com"
  "production:https://vms.hemaya.ae"
)

API_BASE="http://localhost:4000"
for entry in "${URLS[@]}"; do
  [[ "${entry%%:*}" == "$ENV" ]] && API_BASE="${entry#*:}/api" && break
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Hemaya VMS Health Check — $ENV"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▸ API Endpoints"
check "Health endpoint"     "curl -sf --max-time 10 '$API_BASE/health'"
check "Auth endpoint"       "curl -sf --max-time 10 -o/dev/null -w '%{http_code}' '$API_BASE/auth/login' | grep -q '400\|401\|200'"
check "Metrics endpoint"    "curl -sf --max-time 10 '$API_BASE/metrics'"

echo ""
echo "▸ Kubernetes Pods"
NS="hemaya-vms$([ "$ENV" = "staging" ] && echo "-staging" || echo "")"
check "Backend pods running"  "kubectl get pods -n $NS -l app=backend --field-selector=status.phase=Running | grep -q Running"
check "Frontend pods running" "kubectl get pods -n $NS -l app=frontend --field-selector=status.phase=Running | grep -q Running"
check "Postgres running"      "kubectl get pods -n $NS -l app=postgres --field-selector=status.phase=Running | grep -q Running"
check "Redis running"         "kubectl get pods -n $NS -l app=redis --field-selector=status.phase=Running | grep -q Running"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e " Results: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

[[ $FAIL -gt 0 ]] && exit 1 || exit 0
