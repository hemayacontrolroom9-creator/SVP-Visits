# Contributing to Hemaya VMS

## Development Setup

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/hemayacontrolroom9-creator/SVP-Visits.git
cd SVP-Visits
make setup
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `hotfix/*` | Production hotfixes |

## Commit Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: backend, frontend, mobile, infra

Examples:
feat(backend): add GPS geofence validation to check-in
fix(mobile): resolve offline sync queue race condition
docs(api): update visit endpoints documentation
```

## Pull Request Process

1. Branch from `develop`
2. Write/update tests for your changes
3. Ensure `make lint` and `make test` pass
4. Open a PR against `develop` with a clear description

## Code Style

- **Backend**: NestJS conventions, ESLint + Prettier enforced
- **Frontend**: React functional components, hooks only, no class components
- **Mobile**: Flutter/Dart, follow `flutter analyze` guidelines

## Environment Variables

Never commit `.env` files. Always update `.env.example` when adding new variables.
