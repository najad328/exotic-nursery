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
_To be added when Phase 1 begins_

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
