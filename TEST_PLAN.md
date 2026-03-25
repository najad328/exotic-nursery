# Test Plan — Exotic Plants Nursery App

> Updated per phase. Every feature gets Happy Path, Edge Cases, and Failure States.

---

## Phase 0: Scaffolding

### Happy Path
- [ ] `pnpm install` completes without errors
- [ ] `pnpm turbo build` passes for all workspaces
- [ ] `pnpm turbo typecheck` passes for all workspaces
- [ ] `pnpm turbo lint` passes for all workspaces
- [ ] Mobile app boots with `pnpm --filter @exotic-nursery/mobile dev`
- [ ] Admin app boots with `pnpm --filter @exotic-nursery/admin dev`
- [ ] CI pipeline passes on GitHub Actions

### Edge Cases
- [ ] Running `pnpm turbo build` twice in a row uses cache (fast second run)
- [ ] Shared packages are importable from both apps

### Failure States
- [ ] Missing `.env` variables → clear error message, not a crash
- [ ] Running on Node < 22 → engine check fails gracefully

---

## Phase 1: Auth + Plant Catalog

### Auth — Happy Path
- [ ] User registers with email + password → profile auto-created in `profiles` table
- [ ] User logs in with valid credentials → redirected to home tab
- [ ] User logs out → session cleared, redirected to login screen
- [ ] Admin logs into admin dashboard → sees dashboard with plant/category counts
- [ ] Non-admin user attempts admin login → gets "Access denied" error

### Auth — Edge Cases
- [ ] Register with already-used email → shows error, doesn't crash
- [ ] Login with wrong password → shows error message
- [ ] Very long full name (200+ chars) → handled gracefully
- [ ] Concurrent login from mobile + admin → both sessions work independently
- [ ] Session expiry → auto-redirects to login

### Auth — Failure States
- [ ] Supabase unreachable → error message, not a white screen
- [ ] Missing env vars → clear error at startup
- [ ] Malformed email input → client-side validation blocks submit

### Plant Catalog — Happy Path
- [ ] Home screen loads categories and featured plants from Supabase
- [ ] Tapping a category filters the search results
- [ ] Search by plant name returns matching results (fuzzy via pg_trgm)
- [ ] Plant detail screen shows all fields: name, price, description, care info, tips
- [ ] Prices display correctly in INR format (paise → ₹X.XX)
- [ ] Discount percentage calculates correctly from compare_at_price

### Plant Catalog — Edge Cases
- [ ] Empty search query → shows all plants
- [ ] Search with no results → shows "No plants found" empty state
- [ ] Plant with no image → shows placeholder emoji
- [ ] Plant with stock_quantity = 0 → shows "Out of stock", Add to Cart disabled
- [ ] Very long plant name → truncated with ellipsis, doesn't break layout
- [ ] Category with 0 plants → shows empty state in search

### Plant Catalog — Failure States
- [ ] Network timeout while loading catalog → error state, not infinite spinner
- [ ] Navigating to non-existent plant slug → shows "Plant not found"
- [ ] RLS blocks unauthorized access → anon users cannot see inactive plants

### RLS Security Tests (Adversarial)
- [ ] Unauthenticated request to `profiles` → returns empty (RLS blocks)
- [ ] Customer A cannot read Customer B's profile
- [ ] Non-admin cannot query `is_active = false` plants
- [ ] Non-admin cannot INSERT/UPDATE/DELETE on `plants` table
- [ ] Non-admin cannot INSERT/UPDATE/DELETE on `categories` table

## Phase 2: Admin Plant Management
_To be added when Phase 2 begins_

## Phase 3: Cart + Ordering + COD
_To be added when Phase 3 begins_

## Phase 4: Order Tracking + Notifications
_To be added when Phase 4 begins_

## Phase 5: WhatsApp Integration
_To be added when Phase 5 begins_

## Phase 6: AI Plant Chatbot
_To be added when Phase 6 begins_

## Phase 7: Admin Analytics
_To be added when Phase 7 begins_

## Phase 8: Polish + Production
_To be added when Phase 8 begins_
