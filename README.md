<div align="center">
  <h1>🛡️ Hemaya VMS</h1>
  <p><strong>Supervisor Visit Management System</strong></p>
  <p>Hemaya Security Services Co. — حماية للخدمات الأمنية</p>
  <br/>

  ![Node](https://img.shields.io/badge/Node-20-green?logo=node.js)
  ![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)
  ![React](https://img.shields.io/badge/React-18-blue?logo=react)
  ![Flutter](https://img.shields.io/badge/Flutter-3-blue?logo=flutter)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
  ![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
</div>

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Quick Start (One Command)](#quick-start)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [Environment Variables](#environment-variables)
7. [Default Accounts](#default-accounts)
8. [API Documentation](#api-documentation)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (80/443)                       │
│              Reverse Proxy + SSL Termination                │
└────────────┬─────────────────────────┬──────────────────────┘
             │                         │
    ┌────────▼────────┐     ┌──────────▼──────────┐
    │  React Frontend  │     │   NestJS Backend     │
    │  (Vite + MUI)   │     │   REST API + WS      │
    │  Port: 5173     │     │   Port: 3000         │
    └─────────────────┘     └──────┬───────────────┘
                                   │
            ┌──────────────────────┼───────────────────┐
            │                      │                   │
   ┌────────▼───────┐   ┌──────────▼──────┐  ┌────────▼──────┐
   │  PostgreSQL 16  │   │   Redis 7        │  │  MinIO (S3)   │
   │  Port: 5432    │   │   Port: 6379     │  │  Port: 9000   │
   └────────────────┘   └─────────────────┘  └───────────────┘

   ┌─────────────────────────────────────────────────────────┐
   │                   Monitoring Stack                       │
   │   Prometheus (9090) → Grafana (3001) ← Loki (3100)      │
   └─────────────────────────────────────────────────────────┘

   ┌───────────────────────┐
   │  Flutter Mobile App   │
   │  iOS + Android        │
   │  GPS + QR + Offline   │
   └───────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 10, TypeScript, TypeORM, PostgreSQL 16, Redis 7 |
| **Frontend** | React 18, Vite, Material UI 5, Redux Toolkit, React Query |
| **Mobile** | Flutter 3, Riverpod, GoRouter, Hive, Geolocator |
| **Infrastructure** | Docker, Kubernetes, Nginx, GitHub Actions |
| **Monitoring** | Prometheus, Grafana, Loki, Promtail |
| **Storage** | MinIO (dev) / AWS S3 (prod) |
| **Auth** | JWT + Refresh Tokens, bcryptjs, Passport |
| **Realtime** | Socket.IO WebSockets |

---

## ✅ Prerequisites

Before you begin, ensure you have installed:

| Tool | Version | Install |
|------|---------|---------|
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Node.js** | ≥ 20 | [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 10 | Included with Node.js |
| **Flutter** | ≥ 3.0 | [flutter.dev](https://flutter.dev) (mobile only) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com) |

**Recommended VS Code Extensions:**
- ESLint, Prettier, Docker, Thunder Client, GitLens

---

## ⚡ Quick Start

### One command to start everything:

```bash
# 1. Clone the repository
git clone https://github.com/hemayacontrolroom9-creator/SVP-Visits.git
cd SVP-Visits

# 2. Run setup (installs deps + starts Docker + migrates DB + seeds data)
make setup

# OR manually:
cp .env.example .env
make start
```

After ~60 seconds, access:

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | http://localhost:5173 |
| 🔌 **API** | http://localhost:3000/api |
| 📚 **Swagger** | http://localhost:3000/api/docs |
| ❤️ **Health** | http://localhost:3000/health |
| 📊 **Grafana** | http://localhost:3001 |
| 🔍 **Prometheus** | http://localhost:9090 |
| 🗃️ **MinIO Console** | http://localhost:9001 |

---

## 💻 Local Development

### Option A — Docker (Recommended)

```bash
# Start all services
make start

# Watch backend logs
make logs-backend

# Run migrations
make migrate

# Seed database
make seed

# Stop everything
make stop

# Full reset (⚠️ deletes all data)
make db-reset
```

### Option B — Local (Backend outside Docker)

```bash
# Start only infrastructure
docker compose up -d postgres redis minio

# Install dependencies
make install

# Run backend in watch mode
make dev-backend

# In another terminal, run frontend
make dev-frontend
```

### Database Commands

```bash
# Run all pending migrations
make migrate

# Revert last migration
make migrate-revert

# Seed initial data
make seed

# Open PostgreSQL shell
make db-shell

# Open Redis CLI
make redis-shell
```

---

## 🚀 Production Deployment

### Step 1 — Server Requirements

- Ubuntu 22.04 LTS (minimum 4 vCPU, 8GB RAM, 50GB SSD)
- Docker Engine 24+ and Docker Compose v2

### Step 2 — SSL Certificate

```bash
# Option A: Let's Encrypt (recommended)
apt install certbot
certbot certonly --standalone -d vms.hemaya.ae
cp /etc/letsencrypt/live/vms.hemaya.ae/fullchain.pem infrastructure/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/vms.hemaya.ae/privkey.pem infrastructure/nginx/ssl/key.pem

# Option B: Self-signed (for testing only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/nginx/ssl/key.pem \
  -out infrastructure/nginx/ssl/cert.pem \
  -subj "/C=AE/ST=Dubai/L=Dubai/O=Hemaya/CN=vms.hemaya.ae"
```

### Step 3 — Environment Configuration

```bash
# Copy and edit production env
cp .env.example .env.production
nano .env.production

# Generate secure secrets
make gen-secrets
```

Required production values:
```env
NODE_ENV=production
DOMAIN=vms.hemaya.ae
DB_PASSWORD=<use output from make gen-secrets>
REDIS_PASSWORD=<use output from make gen-secrets>
JWT_SECRET=<use output from make gen-secrets>
JWT_REFRESH_SECRET=<use output from make gen-secrets>
```

### Step 4 — Deploy

```bash
# Build production images
make prod-build

# Start production
make prod-start

# Run migrations on first deploy
docker compose -f docker-compose.production.yml exec backend node dist/main

# Check status
make prod-status
```

### GitHub Actions Secrets Required

In GitHub → Settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `PRODUCTION_HOST` | Server IP |
| `PRODUCTION_USER` | SSH username |
| `PRODUCTION_SSH_KEY` | Private SSH key |
| `PRODUCTION_DOMAIN` | Your domain |
| `STAGING_HOST` | Staging server IP |
| `STAGING_USER` | SSH username |
| `STAGING_SSH_KEY` | Private SSH key |

---

## 🔐 Environment Variables

### Critical Variables (MUST change in production)

| Variable | Description | Generate With |
|----------|-------------|---------------|
| `DB_PASSWORD` | PostgreSQL password | `openssl rand -base64 24` |
| `REDIS_PASSWORD` | Redis password | `openssl rand -base64 18` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Data encryption key | `openssl rand -hex 16` |

### Quick Secret Generation

```bash
make gen-secrets
```

This prints all required secrets to your terminal. Copy them to `.env.production`.

---

## 👤 Default Accounts

After running `make seed`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@hemaya.ae | `Admin@123456` |
| **Manager** | manager@hemaya.ae | `Manager@123456` |
| **Supervisor** | ahmed@hemaya.ae | `Supervisor@123456` |

> ⚠️ **Change all passwords immediately after first login in production.**

---

## 📚 API Documentation

Interactive Swagger UI is available at: **http://localhost:3000/api/docs**

### Key Endpoints

#### Authentication
```http
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

#### Visits
```http
GET    /api/visits              # List visits (paginated)
POST   /api/visits              # Schedule a visit
GET    /api/visits/:id          # Get visit details
POST   /api/visits/:id/check-in # Check in with GPS/QR
POST   /api/visits/:id/check-out # Check out
PATCH  /api/visits/:id/gps-track # Update GPS track
```

#### Sites
```http
GET  /api/sites           # List all sites
POST /api/sites           # Create site
GET  /api/sites/:id/qr    # Get site QR code
```

#### Reports
```http
GET /api/reports/dashboard     # Dashboard stats
GET /api/reports/visit-summary # Visit summary
GET /api/reports/compliance    # Compliance report
```

#### Authentication Header
```http
Authorization: Bearer <access_token>
```

---

## 📊 Monitoring

### Grafana Dashboards

Access at http://localhost:3001 (dev) or https://yourdomain.com/grafana (prod)

- **Default login**: admin / hemaya_grafana
- **System Overview**: API latency, request rates, error rates
- **Business Metrics**: Visit completion rates, supervisor activity
- **Infrastructure**: CPU, memory, database connections

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

---

## 🔧 Troubleshooting

### Container won't start

```bash
# Check logs
make logs-backend

# Check if ports are in use
lsof -i :3000
lsof -i :5432
lsof -i :6379
```

### Database connection error

```bash
# Verify postgres is healthy
docker compose ps postgres

# Check DB credentials in .env match docker-compose
grep DB_ .env

# Reset and restart
docker compose restart postgres
sleep 5 && make migrate
```

### Redis connection error

```bash
# Verify redis password matches .env
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping
# Should return: PONG
```

### "Port already in use"

```bash
# Stop any existing containers
make stop

# Or kill specific port
kill $(lsof -t -i:3000)
```

### Migration fails

```bash
# Check migration status
make db-shell
# Then in psql:
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;

# Revert and retry
make migrate-revert
make migrate
```

### Backend build fails (sharp / python)

The backend Dockerfile includes `python3 make g++` to compile native modules. If build fails:

```bash
docker compose build --no-cache backend
```

### Resetting everything

```bash
# Nuclear option — removes ALL data
make clean
make setup
```

---

## 📁 Project Structure

```
SVP-Visits/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/            # JWT authentication
│   │   ├── users/           # User management
│   │   ├── visits/          # Visit CRUD + GPS/QR verification
│   │   ├── sites/           # Site management + geofencing
│   │   ├── checklists/      # Checklist templates & responses
│   │   ├── reports/         # Analytics & reporting
│   │   ├── alerts/          # Alert system
│   │   ├── realtime/        # WebSocket gateway
│   │   ├── audit/           # Immutable audit log
│   │   └── common/          # Shared utilities
│   └── test/                # E2E tests
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   ├── store/           # Redux store
│   │   └── types/           # TypeScript types
├── mobile/                  # Flutter app
│   └── lib/
│       ├── screens/         # App screens
│       ├── services/        # API + GPS + sync
│       ├── models/          # Data models
│       └── providers/       # Riverpod providers
├── infrastructure/
│   ├── kubernetes/          # K8s manifests
│   ├── nginx/               # Nginx configs
│   └── scripts/             # Utility scripts
├── monitoring/              # Prometheus + Grafana + Loki
├── docker-compose.yml       # Development environment
├── docker-compose.production.yml # Production environment
├── Makefile                 # Command shortcuts
└── .env.example             # Environment template
```

---

## 📄 License

MIT © Hemaya Security Services Co.

---

<div align="center">
  <p>Built with ❤️ for Hemaya Security Services</p>
  <p>حماية للخدمات الأمنية — Dubai, UAE</p>
</div>
