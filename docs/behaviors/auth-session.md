# Authentication & Session Behaviors (AUTH)

Sources: Master §8, §59, §60; welcome screen design (entry point).
The visual design for auth screens has not been produced yet — see
pending-behaviors.md P-AUTH-1. These behaviors are normative from the master
prompt.

---

## AUTH-01: Phone number normalization

- **Actor:** backend (system rule); affects user input
- **Trigger:** a phone number is submitted for sign-in or sign-up
- **Preconditions:** none
- **Action:** system normalizes the number
- **Visible state:** user sees their number formatted with +251 prefix
- **Expected outcome:** all Ethiopian numbers normalize to the `+251` E.164
  form. Two spellings of the same number are the same account (e.g., `0911...`
  and `+251911...`).
- **Failure outcome:** a number that cannot be normalized to a valid +251
  mobile number is rejected with a clear message; the user can correct it
- **Edge cases:** numbers from other countries are not accepted in this
  release (expansion later); leading zeros are stripped; spaces/dashes ignored
- **Acceptance examples:**
  - Given the user enters `0911 23 45 67`, When they submit, Then the system
    stores/treats it as `+251911234567`

---

## AUTH-02: Sign-in with OTP

- **Actor:** returning user
- **Trigger:** "I ALREADY HAVE AN ACCOUNT" from welcome, or sign-in from
  settings after sign-out
- **Preconditions:** phone number provided
- **Action:** user enters phone number, requests code, enters the code
- **Visible state:** phone entry step, then code entry step with resend option
- **Expected outcome:** a valid code signs the user in and restores their
  account state. Codes are one-time, short-lived, and single-use. Resend
  invalidates the previous code.
- **Failure outcome:**
  - Wrong code → inline error, retry allowed; a limited number of attempts
    before a new code is required
  - Expired code → "code expired" message with resend
  - Undelivered SMS → resend remains available; the user is never silently
    stuck
- **Edge cases:**
  - Sign-in with a number that has no account follows the sign-up path
    (AUTH-03) rather than erroring
  - OTP must never be logged or stored in plain text beyond its validity window
- **Acceptance examples:**
  - Given a registered number, When the user enters the correct code, Then a
    session begins and Home (or onboarding, if never completed) opens
  - Given an unregistered number, When the user completes OTP, Then onboarding
    begins

---

## AUTH-03: Session lifecycle

- **Actor:** signed-in user
- **Trigger:** any authenticated request
- **Preconditions:** valid session
- **Action:** user uses the app
- **Visible state:** n/a (transparent to user)
- **Expected outcome:** sessions use access + refresh credentials; access
  expires shortly, refresh rotates on use; rotation invalidates the previous
  refresh credential. Credentials are stored in the device's secure storage
  only.
- **Failure outcome:** when the session can no longer be refreshed, the user
  is returned to sign-in with a single clear message; no data is lost
- **Edge cases:**
  - Concurrent devices refresh independently without logging each other out
    (unless explicitly revoked)
  - Sign-out clears local session credentials and revokes them server-side
- **Acceptance examples:**
  - Given a signed-in user, When the access credential expires, Then background
    requests succeed using refresh rotation without any prompt
  - Given a revoked session, When the user opens the app, Then they land on
    sign-in, not a broken Home screen

---

## AUTH-04: Future providers (NOT in this release)

- **Actor:** product roadmap
- **Trigger:** future releases
- **Expected outcome:** Google, Apple, and email providers are *supported by
  the design* (account-linking ready) but are not shipped in the first release
- **Acceptance examples:**
  - Given the first release, When a user looks for Google sign-in, Then it is
    not offered
