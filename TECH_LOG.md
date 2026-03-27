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
- **Gemini Flash (free tier)**: 15 RPM, 1M tokens/day, 1500 req/day. Called directly from client — no Edge Function needed.
- **System prompt**: Plant care expert persona. Redirects non-plant questions. Uses emojis.
- **Context window**: Last 10 messages sent for conversational continuity
- **6 suggested starter questions**: Quick interaction without typing
- **No Edge Function**: Calling Gemini from client avoids Supabase function deployment complexity and stays $0

### Dependencies Added
| Package | Purpose | Workspace |
|---|---|---|
| (none — uses native fetch) | Gemini API calls | mobile |

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
- **Recharts for visualizations**: Bar chart (daily orders), line chart (revenue), horizontal bar (top plants), pie chart (status breakdown)
- **Server-side aggregation**: Data aggregated in Next.js server component, passed to client chart components
- **5 KPI cards**: Total revenue, total orders, avg order value, customers, active plants
- **Graceful empty state**: Shows placeholder when no orders exist

### Dependencies Added
| Package | Purpose | Workspace |
|---|---|---|
| recharts | Chart library | admin |

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
| recharts | admin | Chart visualizations |
| react-native-screens | mobile | Navigation |
| react-native-gesture-handler | mobile | Touch gestures |
| react-native-reanimated | mobile | Animations |
