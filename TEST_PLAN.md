# Test Plan — Exotic Plants Nursery App

> Comprehensive test plan covering all 11 phases. Every feature has Happy Path, Edge Cases, and Failure States.

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

## Phase 6: AI Plant Chatbot (Aloe AI)

### Happy Path
- [ ] "Aloe AI" tab → welcome screen with AloeAvatar, "Aloe there!" greeting, 6 suggested questions
- [ ] Tap suggested question → AI responds with plant care advice
- [ ] Type custom question → contextual response
- [ ] Follow-up questions retain context ("What about in winter?" after asking about Monstera watering)
- [ ] Chat history persists across tab switches (loaded from Supabase)
- [ ] Chat history persists across app restarts
- [ ] "Clear" → all history removed from DB and UI
- [ ] Conversation flows naturally (last 20 messages as context)
- [ ] AI responds with "Aloe there!" greeting and plant puns

### Edge Cases
- [ ] Non-plant question → politely redirected ("I'm Aloe AI, your plant care buddy!")
- [ ] Very long message (500 chars) → handled, not truncated
- [ ] Rapid multiple sends → queued, no duplicate responses
- [ ] Tab bar shows leaf icon (different from home's house icon)

### Failure States
- [ ] Invalid/missing Groq API key → friendly error message, not raw JSON
- [ ] Groq API rate limit (429) → auto-retry (2 attempts with backoff), then friendly "AI is busy" message
- [ ] Network error → error bar, previous messages preserved
- [ ] Stale closure → ref-based history avoids missing context in follow-ups

---

## Phase 7: Admin Analytics

### Happy Path
- [ ] Analytics tab → 5 KPI cards with real data
- [ ] Daily orders histogram (TradingView Lightweight Charts, last 30 days)
- [ ] Daily revenue line chart (last 30 days) with ₹ formatting
- [ ] Top selling plants horizontal bar chart (top 10)
- [ ] Order status donut chart (conic-gradient) with legend
- [ ] Charts are responsive and resize correctly

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

## Phase 9: Delivery Pincodes + Courier Tracking

### Delivery Pincodes — Happy Path
- [ ] Checkout: enter valid pincode → "Delivery available! Estimated X days"
- [ ] Pincode auto-fills city field from database
- [ ] Admin: Pincodes page → see all pincodes with area, city, state, delivery days
- [ ] Admin: Add new pincode → visible in customer checkout check
- [ ] Admin: Deactivate pincode → no longer available at checkout

### Delivery Pincodes — Edge Cases
- [ ] Pincode < 6 digits → "Enter a valid 6-digit pincode"
- [ ] Unserviceable pincode → "Sorry, we don't deliver to this pincode yet"
- [ ] Must check pincode before placing order → "Please check pincode availability" error

### Delivery Pincodes — Failure States
- [ ] Network error during pincode check → "Failed to check pincode. Try again."

### Courier Tracking — Happy Path
- [ ] Admin: "Ship with Courier" button visible for pending/confirmed/processing orders
- [ ] Admin: Click Ship → courier assigned, AWB code generated (mock mode)
- [ ] Mobile: shipped order shows Shipment Tracking card with courier name, AWB, estimated delivery
- [ ] Mobile: "Track Shipment" button opens external tracking URL
- [ ] Mobile: tracking events timeline shows pickup, in-transit, out-for-delivery events
- [ ] Realtime: new shipment events appear without refresh

### Courier Tracking — Edge Cases
- [ ] Order already shipped (has AWB) → Ship button hidden
- [ ] Cancelled/delivered orders → Ship button hidden
- [ ] Order with no AWB → no courier tracking card shown

### Courier Tracking — Failure States
- [ ] Ship fails (DB migration not applied) → "Failed to ship" error message
- [ ] Mock mode clearly generates test data (not real courier calls)

---

## Phase 10: Design System + Mobile Restyling

### Verdant Archive Theme — Happy Path
- [ ] All 12 mobile screens use centralized `theme.ts` tokens (no hardcoded colors)
- [ ] Colors: primary green (#2E7D32), primaryContainer (#E8F5E9), background (#FAFDF7)
- [ ] Consistent spacing tokens (xs/sm/md/lg/xl/xxl/xxxl) across all screens
- [ ] Consistent border radius tokens (sm/md/lg/xl/full) across all screens
- [ ] Shadow tokens (sm/md/lg) applied to cards and elevated surfaces
- [ ] Tab bar: home-outline (Home), leaf-outline (Aloe AI) — distinct icons

### Visual Consistency
- [ ] Login/Register: surfaceContainer inputs, leaf logo circle, pill-shaped buttons
- [ ] Home: primaryContainer hero card, outlineVariant plant cards, category circles
- [ ] Search: surfaceContainer search bar, primaryContainer active chips, pill-shaped Apply
- [ ] Cart: surface cards with outlineVariant border, circular quantity controls
- [ ] Orders: tonal status badges (STATUS_STYLES map), outline icons, forward chevron
- [ ] Chatbot: primary user bubbles, surface assistant bubbles with AloeBadge
- [ ] Profile: primaryContainer avatar, outline icons, individual card menu items
- [ ] Plant detail: care items with outlineVariant border, tertiaryContainer tips card
- [ ] Checkout: surfaceContainer inputs, primaryContainer payment selection, pill Place Order
- [ ] Order detail: Ionicons replacing emojis, green courier tracking accent

---

## Phase 11: AI Business Agent (Admin)

### Daily Summary — Happy Path
- [ ] Navigate to Business AI → summary auto-generates on page load
- [ ] Summary includes: today's orders, revenue, trends, pending orders, low stock, recommendations
- [ ] Refresh button reloads summary with fresh data
- [ ] Summary renders Markdown correctly (bold, bullets, headings, numbered lists)

### Daily Summary — Edge Cases
- [ ] No orders today → summary says "No orders received today" with recommendations
- [ ] Zero data (fresh database) → handles gracefully with encouraging message
- [ ] Loading state → "Analyzing your business data..." with spinner

### Daily Summary — Failure States
- [ ] Missing GROQ_API_KEY → "GROQ_API_KEY is not configured" error
- [ ] Groq API rate limit → "Failed to generate summary" with retry button
- [ ] Network error → error state with retry option

### Business Chat — Happy Path
- [ ] Type question → AI responds with data-backed answer
- [ ] Follow-up questions retain context (conversation history sent)
- [ ] Suggested quick questions work when clicked
- [ ] "Which plants should I restock?" → answers from low stock data
- [ ] "Compare this week vs last week" → uses 7-day and 30-day data
- [ ] "Which city has the most orders?" → analyzes delivery city data
- [ ] Chat renders Markdown in AI responses (bold, bullets, etc.)

### Business Chat — Edge Cases
- [ ] Very specific question about data not available → AI says "data doesn't contain enough info"
- [ ] Non-business question → AI stays focused on business context
- [ ] Long conversation → earlier messages still influence context

### Business Chat — Failure States
- [ ] Groq API error → "Sorry, I couldn't process that request" in chat
- [ ] Rapid sends → loading state prevents duplicate submissions

### Security
- [ ] GROQ_API_KEY is server-side only (not in NEXT_PUBLIC_ prefix)
- [ ] API route `/api/ai-summary` only accessible by authenticated admin users
- [ ] Business data not leaked to client — only AI response returned

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
- [ ] Shipment events isolated per user's orders
- [ ] Delivery pincodes readable by all, writable by admin only
- [ ] Admin GROQ_API_KEY not exposed to browser (server-side only)

### TypeScript
- [ ] `pnpm turbo typecheck` → 8/8 pass
- [ ] `pnpm turbo build` → 5/5 pass
- [ ] Zero `any` types in codebase

### CI/CD
- [ ] GitHub Actions CI passes on push to main
- [ ] Lint, typecheck, test, build steps all succeed
- [ ] No Node.js deprecation warnings (actions v5)
