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

---

## 2026-03-25 — Phase 1: Auth + Plant Catalog

### Database Schema Changes
| Table | Columns | Key Design |
|---|---|---|
| `profiles` | id (FK→auth.users), full_name, phone, avatar_url, role, address, city, pincode | Auto-created via trigger on auth.users INSERT. RLS: users see own, admins see all |
| `categories` | id, name, slug, description, image_url, sort_order, is_active | RLS: anyone reads active, admins manage all |
| `plants` | id, category_id (FK), name, slug, description, price_paise, stock_quantity, care_level, sunlight, watering, + 8 more | RLS: anyone reads active, admins manage all. pg_trgm index for fuzzy search |

- **pg_trgm extension** enabled for fuzzy plant name search (`plants_name_trgm_idx`)
- **Prices stored in paise** (integer) — ₹349.00 = 34900 paise
- **`set_updated_at()` trigger** shared across all tables
- **6 categories, 20 exotic plants** seeded

### Architecture Decisions
- **Expo Router (file-based routing)**: Migrated from basic App.tsx to `app/` directory with `(auth)` and `(tabs)` groups. Entry point changed to `expo-router/entry`.
- **Zustand for auth state**: Lightweight store (`authStore.ts`) holds session, user, and profile. Synced with Supabase auth listener in root layout.
- **TanStack Query for server state**: All Supabase data fetching uses `useQuery` with 5-min stale time. Separates server cache from client state.
- **Supabase SSR in admin**: Using `@supabase/ssr` with cookie-based auth for Next.js server components. Middleware checks auth + admin role on every request.
- **Admin route protection**: Dual-layer — middleware redirects unauthenticated/non-admin users, and login page does client-side role check before redirecting.

### Dependencies Added (Phase 1)
| Package | Version | Purpose | Workspace |
|---|---|---|---|
| expo-router | 55.0.x | File-based routing | mobile |
| expo-linking | 55.0.x | Deep linking support | mobile |
| expo-constants | 55.0.x | App constants | mobile |
| expo-splash-screen | 55.0.x | Splash screen | mobile |
| react-native-screens | 4.24.x | Native screen containers | mobile |
| react-native-safe-area-context | 5.7.x | Safe area insets | mobile |
| react-native-gesture-handler | 2.30.x | Touch gestures | mobile |
| react-native-reanimated | 4.2.x | Animations | mobile |
| @expo/vector-icons | 15.1.x | Icon library | mobile |
| @react-native-async-storage/async-storage | 3.0.x | Persistent auth storage | mobile |
| react-native-url-polyfill | 3.0.x | URL API polyfill | mobile |
| zustand | 5.0.x | Client state management | mobile |
| @tanstack/react-query | 5.95.x | Server state / data fetching | mobile |
| @supabase/ssr | 0.9.x | Cookie-based Supabase auth | admin |

### File Structure Added
```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Root: providers, auth listener
│   ├── index.tsx             # Redirect: session → tabs, else → login
│   ├── (auth)/_layout.tsx    # Auth stack
│   ├── (auth)/login.tsx      # Login screen
│   ├── (auth)/register.tsx   # Register screen
│   ├── (tabs)/_layout.tsx    # Tab navigator (Home, Search, Orders, Profile)
│   ├── (tabs)/index.tsx      # Home: categories + featured plants
│   ├── (tabs)/search.tsx     # Catalog with search + category filters
│   ├── (tabs)/orders.tsx     # Placeholder for Phase 3
│   ├── (tabs)/profile.tsx    # Profile + sign out
│   └── plant/[slug].tsx      # Plant detail screen
├── services/
│   ├── supabase.ts           # Typed Supabase client with AsyncStorage
│   ├── auth.ts               # signUp, signIn, signOut, getProfile
│   └── plants.ts             # getPlants, getPlantBySlug, getFeaturedPlants, getCategories
└── stores/
    └── authStore.ts          # Zustand: session, user, profile

apps/admin/src/
├── middleware.ts              # Auth + admin role guard
├── lib/
│   ├── supabase-server.ts    # Server component client
│   ├── supabase-browser.ts   # Client component client
│   └── supabase-middleware.ts # Middleware client with cookie handling
└── app/
    ├── login/page.tsx         # Admin login (client component)
    └── page.tsx               # Dashboard with stats (server component)
```
