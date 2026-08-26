# Subscription & Payment Behaviors (SUB)

Sources: Master §31–§32, §53. Paywall/subscription screens are not yet
designed (P-SUB-1).

---

## SUB-01: Plans & entitlements

- **Actor:** user (subscriber); backend (authority)
- **Trigger:** subscription purchase, change, or entitlement check
- **Preconditions:** active account
- **Action:** user subscribes; backend verifies
- **Visible state:** plan options FREE / PLUS / PRO with feature boundaries
  (design pending — P-SUB-1)
- **Expected outcome:** the backend is the **single source of entitlement
  truth**. The mobile app never decides premium access locally; every
  premium-gated feature checks server-verified entitlement state.
- **Failure outcome:** if the backend cannot verify an entitlement (offline,
  outage), premium features behave according to a defined grace policy —
  never by client-side assumption of premium
- **Edge cases:** subscription lapse mid-session must downgrade experience
  cleanly (features lock; no data loss)
- **Acceptance examples:**
  - Given a modified app claiming PRO locally, When it requests a premium
    feature, Then the backend's entitlement record governs and the claim is
    ignored

---

## SUB-02: Payment abstraction

- **Actor:** backend (system rule)
- **Trigger:** any payment operation
- **Preconditions:** provider configured
- **Action:** create, verify, webhook, refund, or query a transaction
- **Visible state:** user sees provider-branded payment flow (Telebirr,
  CBE Birr, M-PESA, card, bank transfer, or store billing)
- **Expected outcome:** all providers sit behind a single provider interface
  with the operations: createPayment, verifyPayment, handleWebhook, refund,
  getTransaction. Initial provider set: Telebirr, CBE Birr, M-PESA, cards,
  bank transfer, App Store, Google Play. Payment events are recorded and
  auditable.
- **Failure outcome:** a payment that cannot be verified is not treated as
  paid; user-initiated payment failures produce a clear, provider-accurate
  message and a retry path
- **Edge cases:** webhook handling must be idempotent (a duplicated webhook
  never double-credits a subscription)
- **Acceptance examples:**
  - Given a Telebirr payment initiated, When the provider webhook confirms it
    twice, Then exactly one subscription activation results
