# ADR-0008: Accounts, Sessions, and the Server-Side Log Mirror

- **Status:** Accepted
- **Date:** 2026-09-19
- **Deciders:** the maintainer (S3 implementation)
- **Related:** ADR-0002 (slices), ADR-0004 (data semantics), ADR-0007 (provider
  seams), `docs/behaviors/auth-session.md`, `docs/behaviors/offline-sync.md`,
  `docs/behaviors/safety-privacy-consent.md`

## Context

S3 introduces the first slice that holds user data and issues credentials. Three
questions had no answer in the repository before this: how a phone number
becomes an account (AUTH-01), how a sign-in code is delivered and stored when no
Ethiopian SMS gateway has been chosen (P-OTP-1), and what the server is allowed
to be the authority for once a device is also storing the same log (OFF-02,
SUB-01).

Two constraints shaped the decisions. There is no SMS provider credential in
this environment, and the master prompt requires the design to be
international-expansion ready while shipping Ethiopia only.

## Decision

**1. Phone normalization is a single server-side function (AUTH-01).**
`normalizeEthiopianPhone` accepts the spellings people actually type
(`0911 23 45 67`, `+251 911 234 567`, `251911234567`, `911234567`), strips the
trunk zero, requires nine national digits beginning 9 or 7, and returns E.164
`+251…`. Anything else is rejected with a reason code the client turns into copy.
Two spellings of one number therefore produce one account, because there is
exactly one place that decides what "the same number" means.

**2. The sign-in code is never stored, and no gateway is faked (AUTH-02, P-OTP-1).**
A code is six digits, valid for five minutes, single-use, with at most five
verify attempts and a sixty-second resend gap; a resend invalidates the previous
code. Only a salted SHA-256 hash is persisted, for the validity window, and the
comparison is constant time. Delivery goes through an `SmsProvider` seam with
three implementations — `none` (503 `SMS_UNAVAILABLE`), `console` (development
only, refused when `NODE_ENV=production`), and `http` (a generic operator
gateway). When no gateway is configured the request fails honestly and the
outstanding code is invalidated, so a user is never left waiting for an SMS that
was never sent. P-OTP-1 remains open: choosing a gateway is a configuration
change plus, at most, a thin adapter.

**3. Sessions are short-lived access tokens plus rotating refresh chains (AUTH-03).**
The access token is an HS256 JWT carrying only `sub` and `sid`; authorisation
data (plan, consent) is always read from the database. A refresh token is 32
random bytes, stored only as a SHA-256 hash, grouped into a per-device family.
Using a refresh token rotates it; presenting a token that was already rotated is
treated as a leak and revokes that family, while other devices' families are
untouched. Sign-out revokes one family and is idempotent.

**4. The server mirrors the device; it is never the only copy (OFF-02).**
Every synced row carries a client-generated id, which is the idempotency key for
a replayed push, plus a client-supplied `updatedAt` used for last-write-wins.
Deletes are tombstones — a delete is a write, so a conflict can never silently
destroy data. The device remains the read model for history and insights, which
is what keeps OFF-01 (offline logging, cached catalog, history) working without
a connection.

**5. Entitlements and consent are server-owned (SUB-01, SAFE-03/SAFE-06).**
An `Entitlement` row exists for every account, defaults to `FREE`, and is read by
the client — the client never decides premium access. Consent is stored per
(user, kind, version) and **absence of a grant is not consent**: the
AI-improvement flag reads false until a grant row exists. No payment code is
written in S3 because no plans are on sale; only the authority model is.

## Alternatives Considered

- **Client-side phone formatting only.** Rejected: two devices would disagree
  about identity, and "same number = same account" is a data rule.
- **Storing the code in plain text for a few minutes.** Rejected: a database or
  log leak inside the window would be an account takeover, and AUTH-02 states the
  requirement explicitly.
- **A long-lived access token, no refresh.** Rejected: a stolen token would live
  for weeks and there would be no rotation signal to detect reuse.
- **Last-write-wins on the server clock.** Rejected: the device is the writer, so
  its ordering is the one the user experienced; the server clock would reorder
  entries logged offline.
- **Hard deletes on sync.** Rejected: a sync race could delete a meal the user
  still sees, which OFF-02 forbids in as many words.
- **Shipping a dev SMS stub that always "succeeds".** Rejected: it is the fake
  functionality master §71 forbids, and it would hide a misconfiguration until a
  real user could not sign in.

## Consequences

- Sign-in cannot be exercised end-to-end here: there is no gateway credential,
  so the flow is verified with a capturing provider and the `http` gateway is
  configuration rather than tested code.
- A gateway change is configuration; a provider *shape* change (if a chosen
  gateway is not a simple POST) is one adapter class.
- Rotation means a client that loses a refresh response must sign in again; the
  behavior contract accepts this ("when the session can no longer be refreshed,
  the user is returned to sign-in with a single clear message").
- Tombstones mean the mirror grows with edits; the purge CLI removes expired
  sign-in codes, and log retention for synced rows is a deployment policy that
  belongs with the account-deletion work (SAFE-04).

## Migration / Rollback

The `accounts_and_sync` migration is additive: it creates new tables and touches
no existing one. Rolling back the slice is reverting its commits; dropping the
new tables removes the mirror but not the device's own copy, so no user loses
data. Nothing merges to `master` without UAT.
