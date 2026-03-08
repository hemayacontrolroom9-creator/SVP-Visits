.PHONY: help install dev build test lint clean docker-up docker-down migrate seed

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install
	cd mobile && flutter pub get

dev: ## Start development servers (backend + frontend)
	docker-compose up -d postgres redis minio
	cd backend && npm run start:dev &
	cd frontend && npm run dev

build: ## Build all services for production
	cd backend && npm run build
	cd frontend && npm run build

test: ## Run all tests
	cd backend && npm run test
	cd frontend && npm run test

test-e2e: ## Run end-to-end tests
	cd backend && npm run test:e2e

lint: ## Lint all code
	cd backend && npm run lint
	cd frontend && npm run lint

lint-fix: ## Auto-fix lint issues
	cd backend && npm run lint -- --fix
	cd frontend && npm run lint -- --fix

clean: ## Remove build artifacts and node_modules
	rm -rf backend/dist backend/node_modules
	rm -rf frontend/dist frontend/node_modules
	cd mobile && flutter clean

docker-up: ## Start all services with Docker Compose
	docker-compose up -d
	@echo "✅ All services started"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   Backend:   http://localhost:4000"
	@echo "   API Docs:  http://localhost:4000/api/docs"
	@echo "   MinIO:     http://localhost:9001"
	@echo "   Grafana:   http://localhost:3001"

docker-down: ## Stop all Docker services
	docker-compose down

docker-rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

migrate: ## Run database migrations
	cd backend && npm run migration:run

migrate-revert: ## Revert last migration
	cd backend && npm run migration:revert

seed: ## Seed the database with initial data
	cd backend && npm run seed

logs: ## Tail logs for all services
	docker-compose logs -f backend frontend

logs-backend: ## Tail backend logs only
	docker-compose logs -f backend

setup: ## Full initial setup (install + docker + migrate + seed)
	@echo "🚀 Setting up Hemaya VMS..."
	cp -n .env.example .env || true
	$(MAKE) docker-up
	@sleep 5
	$(MAKE) migrate
	$(MAKE) seed
	@echo "✅ Setup complete! Default admin: admin@hemaya.ae / Admin@123456"
