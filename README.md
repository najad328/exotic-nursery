# 🌿 Exotic Plants Nursery

A full-stack mobile app for an exotic plants nursery — customers browse and order plants, admins manage inventory and track orders. Built as a learning project to understand the complete development lifecycle.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo SDK 55 (Expo Router) |
| Admin Dashboard | Next.js 15 App Router (React 19) |
| Backend & DB | Supabase (Postgres, Auth, Storage, Realtime) |
| AI Chatbot | Google Gemini 2.0 Flash (pluggable LLM interface) |
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript 5+ (strict mode, no `any`) |
| Validation | Zod schemas for all data |
| State | Zustand (client) + TanStack Query (server) |
| Charts | Recharts (admin analytics) |
| Styling | Tailwind CSS v4 (admin), React Native StyleSheet (mobile) |

## Project Structure

```
exotic-nursery/
├── apps/
│   ├── mobile/                  # Customer-facing React Native app
│   │   ├── app/                 # Expo Router (file-based routing)
│   │   │   ├── (auth)/          # Login, Register screens
│   │   │   ├── (tabs)/          # Home, Search, Cart, Orders, AI Chat, Profile
│   │   │   ├── plant/[slug]     # Plant detail
│   │   │   ├── order/[id]       # Order detail + realtime tracking
│   │   │   └── checkout         # Checkout with delivery form
│   │   ├── components/          # WhatsAppButton, ErrorBoundary
│   │   ├── services/            # Supabase queries, LLM providers
│   │   └── stores/              # Zustand (auth, cart)
│   └── admin/                   # Admin dashboard (Next.js)
│       └── src/app/(dashboard)/ # Protected admin routes
│           ├── plants/          # CRUD, bulk upload
│           ├── orders/          # Order management + status updates
│           ├── analytics/       # KPIs + Recharts visualizations
│           └── whatsapp/        # Message template management
├── packages/
│   ├── types/                   # Shared TypeScript interfaces (40+ types)
│   ├── utils/                   # Zod validation, WhatsApp utils, env helpers
│   └── supabase/                # Typed Supabase client + DB types
├── supabase/
│   └── migrations/              # 8 SQL migration files
├── TEST_PLAN.md
├── TECH_LOG.md
└── .env.example
```

## Features

### Customer App (Mobile — `localhost:8081`)
- 🔐 Email authentication (register/login) with session persistence
- 🌱 Browse exotic plant catalog with categories and search
- 🔍 Fuzzy search via PostgreSQL `pg_trgm`
- 📋 Plant detail with care info grid (sunlight, watering, care level)
- 🛒 Shopping cart with quantity controls and stock validation
- 💰 COD checkout with delivery address form
- 📦 Order history with status badges
- 📡 Real-time order tracking via Supabase Realtime
- 💬 WhatsApp deep-link buttons (order inquiries, plant questions)
- 🤖 AI plant care chatbot (Google Gemini Flash)
- ⚠️ Error boundary — no white-screen crashes

### Admin Dashboard (Web — `localhost:3000`)
- 🔐 Admin-only access (role-based auth via middleware)
- 📊 Dashboard with live KPIs (plants, orders, revenue)
- 🌿 Plant CRUD — create, edit, deactivate with image upload
- 📤 Bulk upload — CSV/JSON with validation preview
- 📦 Order management — view all orders, update status (forward-only)
- 📈 Analytics — daily orders, revenue trends, top plants, status pie chart
- 💬 WhatsApp templates — browse, fill variables, copy, send
- 💀 Loading skeletons and error boundaries
- 🚫 404 page

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profiles (auto-created on signup via trigger) |
| `categories` | Plant categories (6 seeded) |
| `plants` | Plant catalog (20 seeded) |
| `cart_items` | User shopping carts |
| `orders` | Orders with delivery details + status tracking |
| `order_items` | Snapshot of items at time of order |
| `whatsapp_templates` | Message templates (7 seeded) |
| `chat_history` | AI chatbot conversation history |

**Key patterns:** RLS on every table, prices in paise (integer), atomic `place_order()` function with `SELECT ... FOR UPDATE`, Realtime on orders.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- A Supabase project (free tier)
- A Google Gemini API key (free at https://aistudio.google.com/apikey)

### Setup

```bash
# Clone the repo
git clone https://github.com/najad328/exotic-nursery.git
cd exotic-nursery

# Install dependencies
pnpm install

# Set up environment variables
# For admin: create apps/admin/.env.local
# For mobile: create apps/mobile/.env
# See .env.example for all required variables

# Run all SQL migrations in Supabase SQL Editor (Role: postgres)
# Files are in supabase/migrations/ — run them in order

# Start the mobile app (customer side)
pnpm --filter @exotic-nursery/mobile dev
# Press 'w' to open in browser at localhost:8081

# Start the admin dashboard (in a separate terminal)
pnpm --filter @exotic-nursery/admin dev
# Opens at localhost:3000
```

### Available Commands

```bash
pnpm turbo build        # Build all workspaces
pnpm turbo typecheck    # Type-check all workspaces (8/8 must pass)
pnpm turbo lint         # Lint all workspaces
pnpm turbo test         # Run all tests
```

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Prices in paise (integer) | Avoids floating-point math errors in currency |
| Atomic `place_order()` Postgres function | Prevents overselling with `SELECT ... FOR UPDATE` |
| Pluggable LLM interface | Swap AI providers by changing one import |
| Zustand + TanStack Query split | Client state (auth, cart) vs server cache (catalog, orders) |
| `(dashboard)` route group in admin | Single auth guard layout for all protected routes |
| WhatsApp deep links (not API) | $0 cost, works on both mobile and web |

## Deployment

| Component | Platform | Cost |
|---|---|---|
| Mobile App | Expo EAS (builds + OTA updates) | Free (30 builds/month) |
| Admin Dashboard | Vercel | Free (hobby plan) |
| Database + Auth | Supabase | Free (500MB DB, 50K MAU) |
| AI Chatbot | Google Gemini Flash | Free (15 RPM, 1M tokens/day) |

## License

MIT
