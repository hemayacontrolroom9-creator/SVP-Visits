# Changelog

All notable changes to Hemaya VMS are documented here.

## [1.0.0] - 2026-03-08

### Added
- Full NestJS backend with PostgreSQL + Redis
- JWT authentication with refresh token rotation
- GPS geofence check-in verification (configurable radius per site)
- QR code check-in verification
- Real-time supervisor location tracking via WebSockets
- Checklist templates with 6 field types (yes/no, text, number, rating, photo, signature)
- Immutable audit log (PostgreSQL append-only rules)
- Multi-channel alerts (push notification + email)
- React dashboard with live map, reports, and analytics
- Flutter mobile app with offline sync capability
- Docker Compose development environment
- Kubernetes manifests with HPA
- Prometheus + Grafana + Loki monitoring stack
- GitHub Actions CI/CD pipeline with auto-rollback
- Trivy security scanning
