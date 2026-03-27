# Test Plan — Exotic Plants Nursery App

> Comprehensive test plan covering all 8 phases. Every feature has Happy Path, Edge Cases, and Failure States.

---

## Phase 0: Scaffolding

### Happy Path
- [ ] `pnpm install` completes without errors
- [ ] `pnpm turbo build` passes (5/5 workspaces)
- [ ] `pnpm turbo typecheck` passes (8/8 workspaces)
- [ ] Mobile app boots: `pnpm --filter @exotic-nursery/mobile dev` → press `w`
- [ ] Admin app boots: `pnpm --filter @exotic-nursery/admin dev` → `localhost:3000`

### Edge Cases
- [ ] `pnpm turbo build` second run uses Turborepo cache (faster)
- [ ] Shared packages (`@exotic-nursery/types`, `utils`, `supabase`) importable from both apps

### Failure States
- [ ] Missing `.env` → clear error, not a silent crash

---

## Phase 1: Auth + Plant Catalog

### Auth — Happy Path
- [ ] Register with email + password → profile auto-created in `profiles` table
- [ ] Login with valid credentials → redirected to home tab
- [ ] Logout → session cleared, redirected to login
- [ ] Admin login → sees dashboard with plant/category counts
- [ ] Non-admin attempts admin login → "Access denied" error

### Auth — Edge Cases
- [ ] Register with duplicate email → error message
- [ ] Login with wrong password → error message
- [ ] Session expiry → auto-redirect to login

### Auth — Failure States
- [ ] Supabase unreachable → error message, not white screen
- [ ] Malformed email → client-side validation blocks submit

### Plant Catalog — Happy Path
- [ ] Home screen loads categories + featured plants
- [ ] Tap category → filters search results
- [ ] Search by plant name → fuzzy results via pg_trgm
- [ ] Plant detail shows: name, price (₹X.XX), description, care grid, tips
- [ ] Prices display correctly (paise → INR)

### Plant Catalog — Edge Cases
- [ ] Empty search → shows all plants
- [ ] No results → "No plants found" empty state
- [ ] Plant with no image → placeholder emoji
- [ ] Plant with stock = 0 → "Out of stock", Add to Cart disabled

### RLS Security Tests
- [ ] Unauthenticated request to `profiles` → blocked by RLS
- [ ] Customer A cannot read Customer B's profile
- [ ] Non-admin cannot see `is_active = false` plants
- [ ] Non-admin cannot INSERT/UPDATE/DELETE on `plants` or `categories`

---

## Phase 2: Admin Plant Management

### Happy Path
- [ ] Admin navigates to Plants → sees all plants with search/filter
- [ ] Admin clicks "Add Plant" → fills form → plant saved and visible in mobile catalog
- [ ] Admin uploads image → stored in Supabase Storage, preview shows
- [ ] Admin edits existing plant → changes persist
- [ ] Admin deactivates plant → no longer visible in mobile catalog
- [ ] Bulk upload CSV → preview table → confirm → plants inserted
- [ ] Bulk upload JSON → same flow as CSV

### Edge Cases
- [ ] CSV with validation errors → amber warning, invalid rows skipped
- [ ] CSV with unknown category name → row flagged as error
- [ ] Image > 5MB → rejected with error message
- [ ] Duplicate slug → database error shown to admin
- [ ] Empty CSV file → "No valid rows" message

### Failure States
- [ ] Non-admin user → redirected to login
- [ ] Storage bucket missing → upload error with clear message

---

## Phase 3: Cart + Ordering + COD

### Cart — Happy Path
- [ ] Tap "Add to Cart" on plant detail → cart badge updates
- [ ] Cart tab shows items with quantity, price, subtotal
- [ ] Increase quantity → total updates
- [ ] Decrease to 0 or tap ✕ → item removed
- [ ] "Proceed to Checkout" navigates to checkout screen

### Cart — Edge Cases
- [ ] Add same plant twice → quantity increments (not duplicate row)
- [ ] Quantity > stock → +button disabled
- [ ] Plant deactivated while in cart → "Unavailable" label
- [ ] Empty cart → "Your cart is empty" with browse button

### Checkout — Happy Path
- [ ] Delivery form pre-filled from profile
- [ ] Fill all required fields → "Place Order (COD)" → order created
- [ ] Stock decremented in database after order
- [ ] Cart cleared after successful order
- [ ] Redirect to order confirmation with success banner

### Checkout — Edge Cases
- [ ] Missing required field → inline validation error
- [ ] Phone < 10 digits → validation error
- [ ] Pincode ≠ 6 digits → validation error

### Checkout — Failure States
- [ ] Insufficient stock at order time → `place_order()` raises exception with plant name
- [ ] Concurrent orders for last item → only one succeeds (row lock via `FOR UPDATE`)
- [ ] Network error during order → error message, order not created

### Order History — Happy Path
- [ ] Orders tab shows all past orders with status badges
- [ ] Tap an order → navigates to order detail
- [ ] Order detail shows items, delivery address, payment method, status tracker

---

## Phase 4: Order Tracking + Admin Orders

### Admin Orders — Happy Path
- [ ] Admin: Orders tab → sees all orders in table
- [ ] Filter by status (e.g., "pending") → only matching orders shown
- [ ] Search by order ID or customer name → matches correctly
- [ ] Click order → full detail with items, delivery, payment
- [ ] Update status: pending → confirmed → processing → shipped → delivered
- [ ] Cancel order → status = "cancelled", no further transitions

### Admin Orders — Edge Cases
- [ ] Cannot go backward in status (e.g., confirmed → pending blocked)
- [ ] Cancelled/delivered orders → no status update controls shown
- [ ] Order with no items (shouldn't happen) → handled gracefully

### Realtime Tracking — Happy Path
- [ ] Mobile: open order detail → admin updates status → mobile shows new status **live** without refresh
- [ ] Status tracker animation advances to new step

### Realtime — Edge Cases
- [ ] Leave order detail and come back → latest status shown
- [ ] Multiple rapid status changes → all reflected in order

### Dashboard Stats
- [ ] Total orders count matches database
- [ ] Active orders count matches pending/confirmed/processing orders

---

## Phase 5: WhatsApp Integration

### Mobile — Happy Path
- [ ] Plant detail: "Ask about this plant" → opens WhatsApp with plant name in message
- [ ] Order detail: "Contact Nursery" → opens WhatsApp with order-specific message
- [ ] Message adapts to current order status

### Mobile — Edge Cases
- [ ] WhatsApp not installed (web) → opens WhatsApp Web in new tab
- [ ] Missing phone number in env → uses fallback number

### Admin Templates — Happy Path
- [ ] WhatsApp tab → see 7 templates listed by category
- [ ] Click template → fill variables → preview updates live
- [ ] "Copy Message" → text copied to clipboard
- [ ] Enter phone + "Send" → WhatsApp Web opens with pre-filled message
- [ ] Edit template message → save → updated text shown

### Admin Templates — Edge Cases
- [ ] Template with no variables → preview shows message as-is
- [ ] Phone number < 10 digits → "Send" button disabled

---

## Phase 6: AI Plant Chatbot

### Happy Path
- [ ] "Ask AI" tab → welcome screen with 6 suggested questions
- [ ] Tap suggested question → AI responds with plant care advice
- [ ] Type custom question → contextual response
- [ ] Chat history persists across tab switches
- [ ] "Clear Chat" → all history removed
- [ ] Conversation flows naturally (last 10 messages as context)

### Edge Cases
- [ ] Non-plant question → politely redirected ("I'm your plant care assistant!")
- [ ] Very long message (500 chars) → handled, not truncated
- [ ] Rapid multiple sends → queued, no duplicate responses

### Failure States
- [ ] Invalid/missing Gemini API key → error message, not crash
- [ ] Gemini API rate limit → error shown, retry possible
- [ ] Network error → error bar, previous messages preserved

---

## Phase 7: Admin Analytics

### Happy Path
- [ ] Analytics tab → 5 KPI cards with real data
- [ ] Daily orders bar chart (last 30 days)
- [ ] Daily revenue line chart (last 30 days)
- [ ] Top selling plants horizontal bar chart
- [ ] Order status pie chart with color coding
- [ ] Tooltips show details on hover

### Edge Cases
- [ ] No orders → graceful empty state ("Charts will appear once customers start placing orders")
- [ ] Single order → charts render with one data point
- [ ] Cancelled orders excluded from revenue calculations

---

## Phase 8: Polish

### Error Handling
- [ ] Mobile: app crash → ErrorBoundary shows "Try Again" (not white screen)
- [ ] Admin: page error → error.tsx shows retry button
- [ ] Admin: non-existent URL → 404 page with "Back to Dashboard"

### Loading States
- [ ] Admin dashboard → skeleton animation while loading
- [ ] Admin plants list → skeleton animation
- [ ] Admin orders list → skeleton animation

### Environment
- [ ] `.env.example` documents all required variables
- [ ] `validateEnv()` utility available for startup checks

---

## Cross-Cutting Tests

### Performance
- [ ] Plant catalog loads in < 2 seconds
- [ ] Admin dashboard loads in < 3 seconds
- [ ] Cart operations (add/remove) respond in < 1 second

### Security (RLS Penetration)
- [ ] Customer cannot see other customers' orders
- [ ] Customer cannot see other customers' cart items
- [ ] Customer cannot modify orders (only `place_order()` function can)
- [ ] Customer cannot access admin routes
- [ ] All storage policies enforce admin-only write
- [ ] Chat history isolated per user

### TypeScript
- [ ] `pnpm turbo typecheck` → 8/8 pass
- [ ] `pnpm turbo build` → 5/5 pass
- [ ] Zero `any` types in codebase
