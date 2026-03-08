# Supervisor Visit Management System

A cloud-based enterprise platform for scheduling, tracking, and verifying supervisor field visits with GPS verification, QR code check-in, real-time tracking, and comprehensive analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, PostgreSQL, Redis, WebSockets |
| Frontend | React, Material UI, Redux Toolkit, React Query |
| Mobile | Flutter (iOS & Android) |
| DevOps | Docker, Kubernetes, GitHub Actions |
| Monitoring | Prometheus, Grafana, Loki |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Flutter SDK 3.x
- Google Maps API Key

### Local Development

```bash
# 1. Clone and setup environment
cp .env.example .env
# Fill in your environment variables

# 2. Start all services
docker-compose up -d

# 3. Backend (http://localhost:3000)
cd backend && npm install && npm run migration:run && npm run start:dev

# 4. Frontend (http://localhost:5173)
cd frontend && npm install && npm run dev

# 5. Mobile
cd mobile && flutter pub get && flutter run
```

### API Documentation
- Swagger UI: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

### Monitoring
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## Architecture

```
supervisor-visit-management/
├── backend/          # NestJS REST API + WebSocket
├── frontend/         # React Dashboard
├── mobile/           # Flutter Mobile App
├── infrastructure/   # K8s + Docker configs
├── monitoring/       # Prometheus + Grafana
└── .github/          # CI/CD Pipelines
```

## Features
- ✅ Visit Scheduling & Management
- ✅ GPS Location Verification & Geofencing
- ✅ QR Code Check-in/Check-out
- ✅ Photo Upload & Storage
- ✅ Digital Checklist Forms
- ✅ Real-time Supervisor Tracking
- ✅ Smart Alerts & Notifications
- ✅ Reports & Analytics Dashboard
- ✅ Immutable Audit Log
- ✅ Role-Based Access Control (RBAC)
- ✅ Offline Mode with Auto-sync (Mobile)

## Roles
- **Admin**: Full system access
- **Manager**: Manage supervisors, view all reports
- **Supervisor**: Conduct visits, submit reports
- **Viewer**: Read-only dashboard access
