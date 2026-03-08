#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Hemaya VMS — Database Backup Script
# Usage: ./backup.sh [--env staging|production] [--upload]
# ─────────────────────────────────────────────────────────────

ENV="${BACKUP_ENV:-production}"
UPLOAD="${BACKUP_UPLOAD:-false}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/hemaya-vms}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="hemaya_vms_${ENV}_${TIMESTAMP}.sql.gz"

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%T)] $1${NC}"; }
fail() { echo -e "${RED}[$(date +%T)] ERROR: $1${NC}"; exit 1; }

mkdir -p "$BACKUP_DIR"

log "Starting backup for $ENV environment..."

# Load env vars
if [[ -f ".env.${ENV}" ]]; then
  set -a; source ".env.${ENV}"; set +a
elif [[ -f ".env" ]]; then
  set -a; source ".env"; set +a
fi

# Dump database
log "Dumping PostgreSQL database..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${DB_USERNAME:-hemaya}" \
  -d "${DB_NAME:-hemaya_vms}" \
  --verbose \
  --no-owner \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_DIR/$FILENAME"

BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
log "Backup created: $FILENAME ($BACKUP_SIZE)"

# Upload to S3-compatible storage
if [[ "$UPLOAD" == "true" ]]; then
  log "Uploading to S3..."
  aws s3 cp "$BACKUP_DIR/$FILENAME" \
    "s3://${BACKUP_BUCKET:-hemaya-vms-backups}/$ENV/$FILENAME" \
    --storage-class STANDARD_IA
  log "Upload complete"
fi

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
log "Cleanup done"

log "✅ Backup complete: $FILENAME"
