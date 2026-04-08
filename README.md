# 🌿 Exotic Plants Nursery

A full-stack mobile app for an exotic plants nursery — customers browse and order plants, admins manage inventory and track orders. Built as a learning project to understand the complete development lifecycle.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo SDK 55 (Expo Router) |
| Admin Dashboard | Next.js 15 App Router (React 19) |
| Backend & DB | Supabase (Postgres, Auth, Storage, Realtime) |
| AI Chatbot (Mobile) | Groq (Llama 3.3 70B) — pluggable LLM interface |
| AI Business Agent (Admin) | Groq (Llama 3.3 70B) — server-side analytics |
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript 5+ (strict mode, no `any`) |
| Validation | Zod schemas for all data |
| State | Zustand (client) + TanStack Query (server) |
| Charts | TradingView Lightweight Charts (admin analytics) |
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
│   │   ├── components/          # WhatsAppButton, ErrorBoundary, AloeIcon
│   │   ├── services/            # Supabase queries, LLM providers (Groq, Gemini)
│   │   ├── stores/              # Zustand (auth, cart)
│   │   └── theme.ts             # Centralized design tokens (Verdant Archive)
│   └── admin/                   # Admin dashboard (Next.js)
│       └── src/app/(dashboard)/ # Protected admin routes
│           ├── plants/          # CRUD, bulk upload
│           ├── orders/          # Order management + status updates
│           ├── analytics/       # KPIs + TradingView Lightweight Charts
│           ├── business-ai/     # AI business summary + chat agent
│           └── whatsapp/        # Message template management
├── packages/
│   ├── types/                   # Shared TypeScript interfaces (40+ types)
│   ├── utils/                   # Zod validation, WhatsApp utils, env helpers
│   └── supabase/                # Typed Supabase client + DB types
├── supabase/
│   └── migrations/              # 10 SQL migration files
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
- 🤖 **Aloe AI** — plant care chatbot (Groq/Llama 3.3 70B, "Aloe there!" personality)
- 🎨 Verdant Archive design system — Material You inspired theme across all screens
- 📷 Multi-image carousel with navigation arrows
- 🔗 Share bar (WhatsApp, Facebook, Copy Link, native share)
- 🚚 Courier tracking with Shiprocket integration (mock mode)
- ⚠️ Error boundary — no white-screen crashes

### Admin Dashboard (Web — `localhost:3000`)
- 🔐 Admin-only access (role-based auth via middleware)
- 📊 Dashboard with live KPIs (plants, orders, revenue)
- 🌿 Plant CRUD — create, edit, deactivate with image upload
- 📤 Bulk upload — CSV/JSON with validation preview
- 📦 Order management — view all orders, update status (forward-only)
- 📈 Analytics — daily orders, revenue trends, top plants (TradingView Lightweight Charts)
- ✨ **Business AI** — AI-powered daily summary + interactive chat agent (Groq/Llama 3.3)
- 🚚 Courier shipping — Ship with Courier button (Shiprocket mock integration)
- 💬 WhatsApp templates — browse, fill variables, copy, send
- 📍 Delivery pincode management
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
| `delivery_pincodes` | Serviceable delivery areas with estimated days |
| `shipment_events` | Courier tracking timeline events |

**Key patterns:** RLS on every table, prices in paise (integer), atomic `place_order()` function with `SELECT ... FOR UPDATE`, Realtime on orders and shipment events.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- A Supabase project (free tier)
- A Groq API key (free at https://console.groq.com/keys)

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
| Pluggable LLM interface | Swap AI providers by changing one import (Groq default, Gemini available) |
| Centralized design tokens | `theme.ts` with Material You-inspired colors, spacing, radius, shadows |
| Server-side AI in admin | Groq API key stays on server (not exposed to browser) |
| Zustand + TanStack Query split | Client state (auth, cart) vs server cache (catalog, orders) |
| `(dashboard)` route group in admin | Single auth guard layout for all protected routes |
| WhatsApp deep links (not API) | $0 cost, works on both mobile and web |

## Deployment

| Component | Platform | Cost |
|---|---|---|
| Mobile App | Expo EAS (builds + OTA updates) | Free (30 builds/month) |
| Admin Dashboard | Vercel | Free (hobby plan) |
| Database + Auth | Supabase | Free (500MB DB, 50K MAU) |
| AI (Mobile + Admin) | Groq (Llama 3.3 70B) | Free (30 RPM, 14,400 req/day) |

## License

MIT
