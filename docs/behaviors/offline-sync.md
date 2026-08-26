# Offline & Sync Behaviors (OFF)

Sources: Master §62–§63.

---

## OFF-01: Offline capability

- **Actor:** signed-in user without connectivity
- **Trigger:** app opened or used while offline
- **Preconditions:** previously cached state (a fresh install never used
  online has a reduced surface)
- **Action:** log food/water/weight; browse history
- **Visible state:** the app remains usable; no blocking "you are offline"
  dead-ends for the supported offline features
- **Expected outcome:** offline the user can:
  - search foods from the **cached catalog**
  - manually log meals
  - log water
  - log weight
  - view history
  AI photo/text/voice analysis, barcode lookup, payments, and sign-in require
  connectivity and show appropriate guidance when attempted offline.
- **Failure outcome:** an offline attempt at a connectivity-dependent feature
  explains the requirement and offers the offline alternative (e.g., manual
  logging) where one exists
- **Edge cases:** the cached catalog is a snapshot; foods added while online
  are available offline after the next sync
- **Acceptance examples:**
  - Given airplane mode and a previously synced catalog, When the user
    searches "shiro", Then cached Shiro Wot appears and can be logged

---

## OFF-02: Queued synchronization

- **Actor:** system
- **Trigger:** connectivity returns after offline activity
- **Preconditions:** queued offline operations exist
- **Action:** system syncs
- **Visible state:** the user sees queued changes applied to the dashboard;
  failures are surfaced as a reviewable list, not silent drops
- **Expected outcome:** queued operations synchronize in order when the
  connection returns. Conflicts (e.g., same meal edited on two devices)
  resolve deterministically with the latest write per item winning, and the
  resolution never deletes data silently.
- **Failure outcome:** sync failure keeps the queue and retries; the user is
  shown which entries are unsynced
- **Acceptance examples:**
  - Given three offline water logs, When connectivity returns, Then all three
    appear server-side in log order
  - Given an offline meal edited and then synced, When the user re-opens the
    app, Then the edited version is authoritative
