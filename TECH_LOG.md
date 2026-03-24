# Tech Log — Exotic Plants Nursery App

> Tracks architectural decisions, new dependencies, schema changes, and rationale.

---

## 2026-03-24 — Phase 0: Project Scaffolding

### Architecture Decisions
- **Monorepo with Turborepo + pnpm workspaces**: Chosen for shared code between mobile (Expo) and admin (Next.js). Turborepo provides build caching and task orchestration.
- **Expo SDK 55 + React Native 0.83**: Latest stable. Using `blank-typescript` template — will migrate to Expo Router (file-based routing) in Phase 1.
- **Next.js 15 App Router**: Latest stable with React 19 support. Tailwind CSS v4 for styling.
- **Supabase as backend**: Postgres DB, Auth, Storage, Edge Functions, Realtime — all on free tier. Eliminates need for custom backend.
- **TypeScript strict mode**: `noUncheckedIndexedAccess` enabled. Zero `any` policy.
- **Prices in paise (integer)**: Avoids floating-point math errors. ₹150.00 stored as `15000`.

### Dependencies Added
| Package | Version | Purpose | Workspace |
|---|---|---|---|
| turbo | 2.8.x | Monorepo build orchestration | root |
| typescript | 6.0.x | Language | root |
| expo | 55.0.x | Mobile framework | mobile |
| next | 15.3.x | Admin framework | admin |
| react | 19.2.x | UI library | admin, mobile |
| tailwindcss | 4.1.x | Admin styling | admin |
| @supabase/supabase-js | 2.49.x | Supabase client | packages/supabase |

### Folder Structure
```
exotic-nursery/
├── apps/mobile/          # Expo (React Native)
├── apps/admin/           # Next.js App Router
├── packages/types/       # Shared TS interfaces
├── packages/utils/       # Shared utilities
├── packages/supabase/    # Supabase client factory
└── supabase/             # CLI config, migrations, edge functions
```

### CI/CD
- GitHub Actions: lint → typecheck → test → build on every PR and push to main
- Turborepo caching enabled for faster CI runs
