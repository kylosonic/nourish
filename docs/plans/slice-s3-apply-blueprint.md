# Slice S3 (apply half) — blueprint: writing the server's changes back

Status: **PLANNED** (not implemented). Covers the one remaining unit of slice work
in the MVP: consuming `GET /v1/sync/changes` and writing those rows into the local
Drift tables, so a fresh install can be restored and two devices can converge.

The read half is built, unit-tested and live-verified (`SyncApi.changes()`,
`SyncChanges`/`RemoteChange`, proven by `tool/sync_live_check.dart` against the
running API — see the newest evidence block in `docs/swarm/STATE.md`). Nothing in
this file has been implemented.

## Why this is the delicate half

Push cannot damage the user's records: it only sends what the device already
wrote. Apply writes into the same tables the user is logging into, so a mistake
here silently rewrites their history. Three specific hazards, each with the rule
that handles it:

1. **Identity.** A remote row is only recognisable by the `clientId` the device
   minted (`<12-char device id>:<table>:<rowId>`). Local rows have integer ids and
   nothing else, so today a restored row cannot be matched to a local one — a
   second pull would duplicate it. Hence step 1 below.
2. **Tombstones.** A deleted record arrives as a row with `deletedAt` set, not as
   an absence. Treating "not in the response" as "deleted" would wipe a device's
   data on the first pull, and ignoring tombstones would let a deleted meal come
   back.
3. **Authority.** The server's merge rule is device-clock last-write-wins
   (`decideMerge` in `apps/api/src/sync/merge.ts`). The device must apply the same
   rule locally, or the two sides will disagree about which version is current.

## Step 1 — durable local identity (schema v6)

- Add `clientId` (`text().nullable()`) to `Meals`, `WaterLogs` and `WeightLogs` in
  `lib/data/tables/tables.dart`, and an index on it (apply looks rows up by it on
  every pull).
- `AppDatabase.schemaVersion` → 6 with an additive migration:
  `m.addColumn(...)` for each table (no data rewrite; existing rows keep NULL).
- Write it at insert time, in the **same transaction** as the row, using the value
  the queue already mints — `SyncQueueRepository.clientIdFor(table, rowId)` — so a
  local row and its queued operation can never disagree.
- Rows that predate the migration have NULL `clientId`: they are unmatchable, so
  apply must treat them as "unknown" and never delete or overwrite them. A
  one-time backfill is possible (the id scheme is deterministic) but is optional
  and must be its own tested step if done.

## Step 2 — the apply function (pure where it matters)

New `lib/features/sync/apply_changes.dart`, a pure function over (remote rows,
local rows) returning a list of decisions, plus a thin transaction that executes
them. Keeping the decision pure is what makes the merge rules testable without a
database:

- For each remote row:
  - **local row with the same `clientId`** → compare `updatedAt`. Remote newer →
    update locally; local newer or equal → leave alone (this device already has
    the newer edit; pushing it is the push half's job).
  - **no local row, `deletedAt` set** → nothing to do (the delete already
    happened here, or never applied).
  - **no local row, live row** → insert a new local row carrying that `clientId`.
    For meals, insert the meal **and its items in one transaction**, with the
    snapshot the server returned (the app's own frozen-snapshot invariant).
  - **local row exists, remote `deletedAt` set** → delete locally, but **only**
    when the remote tombstone is newer than the local `updatedAt`.
  - **local row with NULL `clientId`** → never touched (see step 1).
- Advance the cursor to `SyncChanges.serverTime` **only after** the transaction
  commits. A crash mid-apply must replay, not skip: replaying is idempotent
  because every branch above is keyed on `clientId` + `updatedAt`.
- A `null` `serverTime` leaves the cursor untouched (already enforced in the
  client).

## Step 3 — when apply runs

- On demand from the account screen ("RESTORE FROM MY ACCOUNT"), and after a
  successful sign-in when the local database is empty — that is the fresh-install
  path, and it is the only place a silent automatic pull is safe.
- Never during a push: one direction at a time, so a failure is attributable.
- Report what happened, per kind: `applied`, `skipped-newer-locally`, `removed`,
  `failed`. A failure is shown, not swallowed — the same rule the push half
  follows for refusals.

## Step 4 — the copy that must change with it

The account screen says *"this is a backup, not a sync"* and
`docs/uat-checklist.md` check 5.12 is written to fail. Both change in the same
commit that lands apply, and not before: until then the copy is true.

## Test matrix (each one is a named test, not a hope)

| Case | Expected |
| --- | --- |
| Remote row unknown locally | Inserted with its `clientId`; items inserted with the meal |
| Remote row also queued locally (same `clientId`) | No duplicate; the push half still owns the outbound copy |
| Remote `updatedAt` older than local | Local row untouched (skipped-newer-locally) |
| Remote `updatedAt` newer than local | Local row updated to the remote values |
| Remote tombstone newer than local | Local row (and its items) removed |
| Remote tombstone older than local | Local row kept |
| Local row with NULL `clientId` | Never modified or deleted |
| Pull run twice with no cursor advance | Second run is a no-op (idempotent) |
| Cursor not advanced when the transaction throws | Next pull replays the same rows |
| Restore into an empty database | Every remote row lands, counts reported per kind |

## Live verification recipe

Extend `apps/mobile/tool/sync_live_check.dart` (or add a sibling) to:

1. sign in;
2. push a meal, a water log and a weight entry with a **device prefix A**, plus
   one deliberately incomplete meal;
3. pull with a **device prefix B** (fresh install simulation) and assert all three
   rows come back;
4. pull again with the same cursor and assert nothing new;
5. leave a tombstone in the mix (push a delete with prefix A) and assert B removes
   it rather than re-creating it.

Requires the local API (`node dist/src/main.js` with `SMS_PROVIDER=console`) and
Docker's Postgres — the same setup the existing live checks use, including reading
the OTP from the API log.

## Definition of done

- `flutter analyze` clean; the matrix above passes; the full mobile suite green.
- The live recipe passes end to end against the local API.
- `docs/uat-checklist.md` 5.12 rewritten to expect a restore, and the account
  screen's push-only copy replaced.
- `docs/swarm/STATE.md` records the evidence and stops describing apply as
  unbuilt.
