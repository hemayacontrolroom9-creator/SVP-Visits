.DEFAULT_GOAL := help
SHELL := /bin/bash
COMPOSE := docker compose
COMPOSE_PROD := docker compose -f docker-compose.production.yml

# ─────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show available commands
	@echo ""
	@echo "  ██╗  ██╗███████╗███╗   ███╗ █████╗ ██╗   ██╗ █████╗"
	@echo "  ██║  ██║██╔════╝████╗ ████║██╔══██╗╚██╗ ██╔╝██╔══██╗"
	@echo "  ███████║█████╗  ██╔████╔██║███████║ ╚████╔╝ ███████║"
	@echo "  ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══██║  ╚██╔╝  ██╔══██║"
	@echo "  ██║  ██║███████╗██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║"
	@echo ""
	@echo "  Visit Management System — Command Reference"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────────────────────────
# QUICK START
# ─────────────────────────────────────────────────────────────
.PHONY: start
start: check-env ## ⭐ Start development environment (ONE COMMAND)
	@echo "🚀 Starting Hemaya VMS..."
	$(COMPOSE) up -d postgres redis minio loki
	@echo "⏳ Waiting for databases..."
	@sleep 5
	$(COMPOSE) up -d backend frontend prometheus grafana promtail
	@echo ""
	@echo "✅ Hemaya VMS is running!"
	@echo ""
	@echo "   🌐 Frontend:    http://localhost:5173"
	@echo "   🔌 API:         http://localhost:3000/api"
	@echo "   📚 Swagger:     http://localhost:3000/api/docs"
	@echo "   ❤️  Health:      http://localhost:3000/health"
	@echo "   📊 Grafana:     http://localhost:3001"
	@echo "   🔍 Prometheus:  http://localhost:9090"
	@echo "   🗃️  MinIO:       http://localhost:9001"
	@echo ""
	@echo "   👤 Admin:       admin@hemaya.ae / Admin@123456"

.PHONY: stop
stop: ## Stop all containers
	$(COMPOSE) down

.PHONY: restart
restart: stop start ## Restart all containers

.PHONY: status
status: ## Show container status
	$(COMPOSE) ps

.PHONY: logs
logs: ## Tail all service logs
	$(COMPOSE) logs -f --tail=100

.PHONY: logs-backend
logs-backend: ## Tail backend logs
	$(COMPOSE) logs -f --tail=100 backend

.PHONY: logs-frontend
logs-frontend: ## Tail frontend logs
	$(COMPOSE) logs -f --tail=100 frontend

# ─────────────────────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────────────────────
.PHONY: setup
setup: ## First-time full setup (install + start + migrate + seed)
	@echo "🔧 Running first-time setup..."
	@cp -n .env.example .env 2>/dev/null && echo "✓ .env created from .env.example" || echo "ℹ️  .env already exists"
	$(MAKE) install
	$(MAKE) start
	@sleep 8
	$(MAKE) migrate
	$(MAKE) seed
	@echo ""
	@echo "✅ Setup complete! Open http://localhost:5173"

.PHONY: install
install: ## Install all npm dependencies
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
.PHONY: migrate
migrate: ## Run database migrations
	@echo "🗃️  Running migrations..."
	cd backend && npm run migration:run

.PHONY: migrate-revert
migrate-revert: ## Revert last migration
	cd backend && npm run migration:revert

.PHONY: seed
seed: ## Seed database with initial data
	@echo "🌱 Seeding database..."
	cd backend && npm run seed

.PHONY: db-reset
db-reset: ## ⚠️  Reset database (DESTROYS ALL DATA)
	@echo "⚠️  WARNING: This will destroy all database data!"
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ] || exit 1
	$(COMPOSE) stop backend
	$(COMPOSE) rm -f postgres
	docker volume rm hemaya-vms_postgres_data 2>/dev/null || true
	$(COMPOSE) up -d postgres
	@sleep 8
	$(MAKE) migrate
	$(MAKE) seed
	$(COMPOSE) start backend

.PHONY: db-shell
db-shell: ## Open PostgreSQL shell
	$(COMPOSE) exec postgres psql -U $${DB_USERNAME:-postgres} -d $${DB_NAME:-supervisor_visits}

.PHONY: redis-shell
redis-shell: ## Open Redis CLI
	$(COMPOSE) exec redis redis-cli -a $${REDIS_PASSWORD:-hemaya_redis_dev}

# ─────────────────────────────────────────────────────────────
# DEVELOPMENT
# ─────────────────────────────────────────────────────────────
.PHONY: dev-backend
dev-backend: ## Run backend in watch mode (local, no docker)
	cd backend && npm run start:dev

.PHONY: dev-frontend
dev-frontend: ## Run frontend dev server (local, no docker)
	cd frontend && npm run dev

.PHONY: build
build: ## Build all services
	cd backend && npm run build
	cd frontend && npm run build

.PHONY: test
test: ## Run all tests
	cd backend && npm run test

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	cd backend && npm run test:e2e

.PHONY: lint
lint: ## Lint all code
	cd backend && npm run lint
	cd frontend && npm run lint

# ─────────────────────────────────────────────────────────────
# PRODUCTION
# ─────────────────────────────────────────────────────────────
.PHONY: prod-start
prod-start: check-prod-env ## Start production environment
	@echo "🚀 Starting production environment..."
	$(COMPOSE_PROD) up -d
	@echo "✅ Production started"

.PHONY: prod-stop
prod-stop: ## Stop production environment
	$(COMPOSE_PROD) down

.PHONY: prod-build
prod-build: ## Build production images
	$(COMPOSE_PROD) build --no-cache

.PHONY: prod-logs
prod-logs: ## Tail production logs
	$(COMPOSE_PROD) logs -f --tail=100

.PHONY: prod-status
prod-status: ## Show production container status
	$(COMPOSE_PROD) ps

# ─────────────────────────────────────────────────────────────
# MAINTENANCE
# ─────────────────────────────────────────────────────────────
.PHONY: clean
clean: ## Remove containers, volumes, and node_modules
	$(COMPOSE) down -v
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist

.PHONY: clean-docker
clean-docker: ## Remove all project Docker resources
	$(COMPOSE) down -v --remove-orphans
	docker image prune -f

.PHONY: backup
backup: ## Backup PostgreSQL database
	bash infrastructure/scripts/backup.sh

.PHONY: health
health: ## Check service health
	@bash infrastructure/scripts/health-check.sh development

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	$(COMPOSE) exec backend sh

.PHONY: shell-frontend
shell-frontend: ## Open shell in frontend container
	$(COMPOSE) exec frontend sh

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
.PHONY: check-env
check-env:
	@[ -f .env ] || (echo "❌ .env file missing. Run: cp .env.example .env" && exit 1)

.PHONY: check-prod-env
check-prod-env:
	@[ -f .env.production ] || (echo "❌ .env.production file missing." && exit 1)

.PHONY: gen-secrets
gen-secrets: ## Generate secure random secrets for .env
	@echo "JWT_SECRET=$(shell openssl rand -hex 32)"
	@echo "JWT_REFRESH_SECRET=$(shell openssl rand -hex 32)"
	@echo "ENCRYPTION_KEY=$(shell openssl rand -hex 16)"
	@echo "SESSION_SECRET=$(shell openssl rand -hex 32)"
	@echo "DB_PASSWORD=$(shell openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"
	@echo "REDIS_PASSWORD=$(shell openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 18)"
	@echo "GRAFANA_PASSWORD=$(shell openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 16)"
