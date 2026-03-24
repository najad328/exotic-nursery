# 🌿 Exotic Plants Nursery

A full-stack mobile app for an exotic plants nursery — customers browse and order plants, admins manage inventory and track orders.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo (SDK 55) |
| Admin Dashboard | Next.js 15 (App Router) |
| Backend & DB | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript (strict mode) |
| Styling | NativeWind (mobile), Tailwind CSS v4 (admin) |

## Project Structure

```
exotic-nursery/
├── apps/
│   ├── mobile/             # Customer-facing React Native app
│   └── admin/              # Admin dashboard (Next.js)
├── packages/
│   ├── types/              # Shared TypeScript interfaces
│   ├── utils/              # Shared utilities & validation
│   └── supabase/           # Supabase client factory & query helpers
├── supabase/               # Migrations, edge functions, seed data
├── TEST_PLAN.md            # Centralized test plan
└── TECH_LOG.md             # Architectural decision log
```

## Features

### Customer App (Mobile)
- Browse exotic plant catalog with search & filters
- Plant detail pages with care instructions
- Shopping cart with COD checkout
- Real-time order tracking
- WhatsApp integration for order updates
- AI-powered plant care chatbot (Google Gemini)

### Admin Dashboard (Web)
- Order management with status updates
- Plant inventory CRUD (manual + CSV bulk upload)
- WhatsApp message templates
- Analytics dashboard (order trends, top-selling plants, revenue)
- Push notification triggers on status changes

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Supabase CLI
- Expo CLI + EAS CLI

### Setup

```bash
# Clone the repo
git clone https://github.com/najad328/exotic-nursery.git
cd exotic-nursery

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase project URL and keys in .env

# Run all apps in development
pnpm dev

# Run a specific app
pnpm --filter @exotic-nursery/mobile dev
pnpm --filter @exotic-nursery/admin dev
```

### Available Commands

```bash
pnpm build        # Build all workspaces
pnpm dev          # Start all apps in dev mode
pnpm lint         # Lint all workspaces
pnpm typecheck    # Type-check all workspaces
pnpm test         # Run all tests
```

## CI/CD

Every pull request triggers a GitHub Actions pipeline:

1. **Lint** — code style checks
2. **Typecheck** — strict TypeScript validation
3. **Test** — unit & integration tests
4. **Build** — production build verification

## Deployment

| Component | Platform |
|---|---|
| Mobile App | Expo EAS (builds + OTA updates) |
| Admin Dashboard | Vercel |
| Edge Functions | Supabase (Deno Deploy) |
| Database | Supabase (managed Postgres) |

## License

MIT
