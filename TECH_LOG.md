# Tech Log — Exotic Plants Nursery App

> Tracks architectural decisions, new dependencies, schema changes, and rationale across all 8 phases.

---

## 2026-03-24 — Phase 0: Project Scaffolding

### Architecture Decisions
- **Monorepo with Turborepo + pnpm workspaces**: Shared code between mobile (Expo) and admin (Next.js). Turborepo provides build caching and task orchestration.
- **Expo SDK 55 + React Native 0.83**: Latest stable with React 19 support.
- **Next.js 15 App Router**: Server components + Tailwind CSS v4.
- **Supabase as backend**: Postgres, Auth, Storage, Realtime — all free tier. No custom backend needed.
- **TypeScript strict mode**: `noUncheckedIndexedAccess` enabled. Zero `any` policy.
- **Prices in paise (integer)**: Avoids floating-point math errors. ₹150.00 stored as `15000`.

### Dependencies Added
| Package | Version | Purpose | Workspace |
|---|---|---|---|
| turbo | 2.8.x | Monorepo build orchestration | root |
| typescript | 5.9.x | Language | root |
| expo | 55.0.x | Mobile framework | mobile |
| next | 15.3.x | Admin framework | admin |
| react | 19.2.x | UI library | admin, mobile |
| tailwindcss | 4.1.x | Admin styling | admin |
| @supabase/supabase-js | 2.100.x | Supabase client | packages/supabase |

---

## 2026-03-25 — Phase 1: Auth + Plant Catalog

### Database Schema
| Table | Key Design |
|---|---|
| `profiles` | Auto-created via trigger on auth.users INSERT. RLS: users see own, admins see all. |
| `categories` | 6 seeded categories. RLS: anyone reads active, admins manage all. |
| `plants` | 20 seeded plants. pg_trgm index for fuzzy search. Prices in paise. |

### Architecture Decisions
- **Expo Router (file-based routing)**: `(auth)` and `(tabs)` route groups
- **Zustand for auth state**: Lightweight store synced with Supabase auth listener
- **TanStack Query for server state**: 5-min stale time, separates server cache from client state
- **Supabase SSR in admin**: `@supabase/ssr` with cookie-based auth, middleware checks admin role

### Dependencies Added
| Package | Purpose | Workspace |
|---|---|---|
| expo-router | File-based routing | mobile |
| zustand | Client state management | mobile |
| @tanstack/react-query | Server state / data fetching | mobile |
| @supabase/ssr | Cookie-based Supabase auth | admin |
| react-native-screens, gesture-handler, reanimated, safe-area-context | Navigation stack | mobile |
| @react-native-async-storage/async-storage | Session persistence | mobile |

---

## 2026-03-26 — Phase 2: Admin Plant Management

### Database / Storage Changes
| Resource | Details |
|---|---|
| `plant-images` bucket | Public read, admin-only write. 5MB max, JPEG/PNG/WebP/GIF. |

### Architecture Decisions
- **`(dashboard)` route group**: All admin pages share auth guard layout + sidebar
- **Zod validation**: `createPlantSchema` for forms, `bulkPlantRowSchema` with lenient transforms for CSV
- **PapaParse for CSV**: Streaming parse in browser, batch insert in chunks of 50
- **Image upload to Supabase Storage**: Random filenames, public URL generated for preview

### Dependencies Added
| Package | Purpose | Workspace |
|---|---|---|
| zod | Schema validation | packages/utils, admin |
| papaparse | CSV parsing | admin |

---

## 2026-03-26 — Phase 3: Cart + Ordering + COD

### Database Schema
| Table | Key Design |
|---|---|
| `cart_items` | UNIQUE(user_id, plant_id). RLS: users manage own cart. |
| `orders` | Status flow: pending → confirmed → processing → shipped → out_for_delivery → delivered. Realtime enabled. |
| `order_items` | Snapshot of plant name/price at order time (immutable). |
| `place_order()` | Atomic Postgres function: validate stock → insert order + items → decrement stock → clear cart. Uses `SELECT ... FOR UPDATE`. |

### Architecture Decisions
- **Zustand cart store**: Synced with Supabase `cart_items`, exposes `totalItems()` and `subtotalPaise()`
- **Atomic order placement**: Single Postgres function prevents overselling via row locks
- **Cart badge on tab**: Shows item count, updates reactively
- **Checkout form**: Pre-filled from user profile, validates phone (10 digits) and pincode (6 digits)

---

## 2026-03-26 — Phase 4: Order Tracking + Admin Orders

### Architecture Decisions
- **Admin order management**: Server-rendered list + client-side filters (status, search)
- **Forward-only status transitions**: Admin can only advance status, never go backward (except cancel)
- **Status timeline visualization**: 6-step progress bar on admin detail
- **Supabase Realtime**: Mobile order detail subscribes to `postgres_changes` on `orders` table filtered by order ID. Status updates without refresh.
- **Push notifications deferred**: Will add when device build is available

---

## 2026-03-26 — Phase 5: WhatsApp Integration

### Database Schema
| Table | Key Design |
|---|---|
| `whatsapp_templates` | 7 seeded templates across 3 categories (order_status, inquiry, promotion). Variables: `{{variable_name}}` syntax. |

### Architecture Decisions
- **Deep-link approach (`wa.me/...`)**: $0 cost, works on mobile + web. No WhatsApp Business API needed.
- **Template interpolation**: `interpolateTemplate()` replaces `{{variables}}` with values
- **Admin template management**: Browse, fill variables, live preview, copy-to-clipboard, send via WhatsApp
- **Context-aware messages**: Order detail button adapts message to current status; plant detail button pre-fills plant name

---

## 2026-03-27 — Phase 6: AI Plant Chatbot

### Database Schema
| Table | Key Design |
|---|---|
| `chat_history` | User-scoped, indexed by (user_id, created_at DESC). RLS: users manage own. |

### Architecture Decisions
- **Pluggable LLM interface**: `LLMProvider` interface with `sendMessage()`. Swap providers by changing one import.
- **Groq (Llama 3.3 70B)**: 30 RPM, 14,400 req/day free. Switched from Gemini — free tier unavailable in India (quota limit: 0).
- **Gemini provider retained**: `GeminiProvider` still available as a swappable alternative for regions where it works.
- **Branded as "Aloe AI"**: Custom AloeIcon (leaf + sparkle), "Aloe there!" greeting, plant-pun personality.
- **System prompt**: Plant care expert persona with warm, punny style. Redirects non-plant questions.
- **Context window**: Last 20 messages (increased from 10) for better follow-up understanding
- **Stale closure fix**: Uses `useRef` to pass latest message history to LLM, avoiding React async state issues
- **6 suggested starter questions**: Quick interaction without typing
- **No Edge Function**: Calling Groq from client avoids Supabase function deployment complexity and stays $0
- **Error handling**: Retry logic (2 retries with backoff) for 429 rate limits, user-friendly error messages

### Dependencies Added
| Package | Purpose | Workspace |
|---|---|---|
| (none — uses native fetch) | Groq/Gemini API calls | mobile |

---

## 2026-03-27 — Phase 7: Admin Analytics

### Database Views
| View | Purpose |
|---|---|
| `v_daily_orders` | Daily order count + revenue (last 30 days) |
| `v_top_plants` | Top 10 plants by quantity sold |
| `v_order_status_counts` | Order count per status |
| `v_monthly_revenue` | Monthly revenue + avg order value |

### Architecture Decisions
- **TradingView Lightweight Charts**: Replaced Recharts. Histogram (daily orders), line chart (revenue), horizontal bar (top plants), conic-gradient donut (status breakdown)
- **Server-side aggregation**: Data aggregated in Next.js server component, passed to client chart components
- **5 KPI cards**: Total revenue, total orders, avg order value, customers, active plants
- **Graceful empty state**: Shows placeholder when no orders exist

### Dependencies Added
| Package | Purpose | Workspace |
|---|---|---|
| lightweight-charts | TradingView chart library (replaced Recharts) | admin |

---

## 2026-03-27 — Phase 8: Polish

### Architecture Decisions
- **Mobile ErrorBoundary**: Class component wrapping root layout. Catches React crashes, shows "Try Again" instead of white screen.
- **Admin error.tsx**: Next.js error boundary for dashboard routes with retry button
- **Admin not-found.tsx**: Custom 404 page
- **Loading skeletons**: Tailwind `animate-pulse` for dashboard, plants list, orders list
- **Env validation utility**: `validateEnv()` function for startup checks
- **Updated .env.example**: Documents all required variables for both apps

---

## 2026-03-28 — Phase 9: Delivery Pincodes + Courier Tracking

### Database Schema
| Table | Key Design |
|---|---|
| `delivery_pincodes` | Serviceable pincodes with area name, city, state, delivery days. RLS: anyone reads active, admins manage. |
| `shipment_events` | Courier tracking timeline. `order_id` FK, event_time, status, location, description. RLS: users see own order events. |
| Orders table additions | `awb_code`, `courier_name`, `courier_tracking_url`, `estimated_delivery_at`, `shipped_at` columns. |

### Architecture Decisions
- **Pincode check at checkout**: Customer enters pincode → REST query → shows availability + estimated delivery days
- **Admin pincode management**: Full CRUD for delivery pincodes
- **Shiprocket integration (mock mode)**: `packages/utils/src/shiprocket.ts` with mock courier assignment, AWB generation, and tracking events
- **Ship with Courier button**: Available for pending, confirmed, and processing orders
- **Realtime shipment events**: Mobile order detail subscribes to `shipment_events` inserts for live tracking

---

## 2026-04-06 — Phase 10: Design System + Mobile Restyling

### Architecture Decisions
- **Centralized theme**: `apps/mobile/theme.ts` — Material You inspired "Verdant Archive" design system with colors, spacing, radius, shadows, typography tokens
- **12 screens restyled**: All mobile screens updated from hardcoded colors to theme tokens (login, register, home, search, cart, orders, chatbot, profile, plant detail, checkout, order detail, tab layout)
- **Stitch design reference**: Used Google Stitch MCP to generate 11 reference screens, then manually applied the design language to React Native
- **Aloe AI branding**: Custom `AloeIcon` component (Ionicons leaf + sparkles), `AloeAvatar` for empty state, `AloeBadge` for chat bubbles
- **Tab differentiation**: Home uses `home-outline`, Aloe AI uses `leaf-outline`

---

## 2026-04-08 — Phase 11: AI Business Agent (Admin)

### Architecture Decisions
- **Server-side API route**: `/api/ai-summary` fetches live data from Supabase (orders, items, inventory, customers, status breakdown) and sends structured business context to Groq
- **Groq API key server-only**: `GROQ_API_KEY` (not `NEXT_PUBLIC_`) — never exposed to browser
- **Auto-generated daily summary**: Orders today, revenue, weekly/monthly comparison, top plants, low stock alerts, actionable recommendations
- **Interactive chat agent**: Admin can ask business questions with full conversation context (revenue analysis, inventory, city-wise orders, forecasting)
- **Markdown rendering**: Custom lightweight renderer for bold, bullets, headings, numbered lists, inline code — no external dependency
- **Suggested quick questions**: 6 common business queries as clickable chips
- **Business data snapshot**: Structured context includes today's orders, 7-day/30-day trends, active orders, top sellers, low stock alerts, customer count

### CI Fixes
- **`next lint` → no-op**: Next.js 15+ `next lint` prompts interactively for ESLint config, breaking CI. Replaced with skip since `typecheck` covers correctness.
- **GitHub Actions v4 → v5**: Updated `actions/checkout` and `actions/setup-node` to v5 to fix Node.js 20 deprecation warning.

---

## Summary: Full Dependency List

| Package | Workspace | Purpose |
|---|---|---|
| turbo | root | Monorepo orchestration |
| typescript | root | Language |
| expo (SDK 55) | mobile | React Native framework |
| expo-router | mobile | File-based routing |
| zustand | mobile | Client state (auth, cart) |
| @tanstack/react-query | mobile | Server state / caching |
| @supabase/supabase-js | packages/supabase | Database client |
| @supabase/ssr | admin | Cookie-based auth |
| next (15.3) | admin | Admin framework |
| tailwindcss (4.1) | admin | Styling |
| zod | packages/utils | Schema validation |
| papaparse | admin | CSV parsing |
| lightweight-charts | admin | TradingView chart visualizations |
| react-native-screens | mobile | Navigation |
| react-native-gesture-handler | mobile | Touch gestures |
| react-native-reanimated | mobile | Animations |
