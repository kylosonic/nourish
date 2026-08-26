# Safety, Privacy, Consent & Corrections Behaviors (SAFE)

Sources: Master §26–§28, §59, §23, §55.

The product is a general wellness and nutrition application. It does not
diagnose or treat.

---

## SAFE-01: Health safety controls

- **Actor:** system (deterministic rules); the user experiences them
- **Trigger:** profile inputs (onboarding/body), target computation, or
  disclosures anywhere in the app
- **Preconditions:** none — controls run before values are accepted
- **Action:** system validates against safety thresholds
- **Visible state:** when triggered, the user sees a plain-language
  explanation and professional-care guidance (directed to consult an
  appropriate health professional). No diagnosis, no treatment advice.
- **Expected outcome:** deterministic (non-AI) controls cover at minimum:
  - **Minors:** users below a defined minimum age are not onboarded into
    calorie-restriction features; the flow stops with guidance
  - **Pregnancy:** disclosed pregnancy adjusts or suspends weight-loss
    targeting with guidance
  - **Eating-disorder disclosures:** disclosed ED history disables calorie
    deficit targeting and points to professional care
  - **Serious medical conditions:** disclosed conditions route to
    professional-care guidance instead of self-managed targets
  - **Extreme weight targets:** current/target weights producing dangerous
    deltas are rejected at entry
  - **Extremely low calorie targets:** targets below a defined safe floor are
    refused regardless of user pace choice (incl. Aggressive)
- **Failure outcome:** a value that trips a control is not persisted; the
  user is told why in human language and given the care path
- **Edge cases:** thresholds are configuration, not code magic numbers;
  the refusal copy never reads as a diagnosis
- **Acceptance examples:**
  - Given a user entering a target weight implying a −2 kg/week pace, When
    they submit, Then the pace/target is refused with guidance
  - Given an age below the minimum, When onboarding reaches body info, Then
    the flow cannot proceed into target-setting

---

## SAFE-02: Sensitive data treatment

- **Actor:** backend (system rule)
- **Trigger:** any storage/transmission of nutrition, body metrics, food
  images, or fitness data
- **Preconditions:** n/a
- **Action:** system protects the data
- **Visible state:** n/a
- **Expected outcome:** the data classes above are treated as sensitive:
  encrypted in transit and at rest, access-controlled, and never shipped to
  third-party analytics. Analytics receive no raw sensitive nutrition data
  (Master §55).
- **Failure outcome:** n/a (system guarantee; verified in security review)
- **Acceptance examples:**
  - Given an analytics event "meal_confirmed", When it fires, Then it carries
    no food names, weights, or macro values

---

## SAFE-03: Consent tracking

- **Actor:** user
- **Trigger:** first run and whenever consent terms change
- **Preconditions:** none
- **Action:** user accepts/declines each consent purpose
- **Visible state:** consent screens with per-purpose choices (design pending —
  P-SAFE-1)
- **Expected outcome:** every purpose (marketing comms, analytics, AI
  improvement) is consented individually; each acceptance/withdrawal is
  timestamped and recorded (consent records). Withdrawal takes effect
  immediately for future processing.
- **Failure outcome:** a purpose without consent is not processed; refusing
  non-essential purposes never blocks core app use
- **Acceptance examples:**
  - Given the user declines analytics, When they later log a meal, Then no
    analytics event for that user is emitted

---

## SAFE-04: Data rights — export & deletion

- **Actor:** user (via Profile/Settings/Privacy Center; screens pending design —
  P-SAFE-1)
- **Trigger:** user requests export or deletion
- **Preconditions:** active session
- **Action:** request export; or request account deletion
- **Visible state:** export → a downloadable copy of the user's data
  (in-progress indicator until ready); deletion → confirmation of
  destruction
- **Expected outcome:**
  - **Export** produces the user's personal data (profile, logs, targets,
    consents) in a machine-readable form, delivered through the app
  - **Deletion** requires explicit confirmation; destroys or irreversibly
    anonymizes the account's personal data per retention rules; subscription
    and payment records follow the legally required retention, clearly
    described to the user
- **Failure outcome:** deletion is never "soft" while claiming to be complete;
  if backend deletion is scheduled, the user is told the timeline
- **Edge cases:** deletion must also revoke all sessions and tokens
- **Acceptance examples:**
  - Given a deletion request, When the user confirms, Then the app signs out,
    the account cannot sign in again, and personal data removal completes
    within the stated window

---

## SAFE-05: Food imagery retention & metadata

- **Actor:** backend (system rule)
- **Trigger:** every image upload (SCAN-03)
- **Preconditions:** image submitted
- **Action:** store processed copy
- **Visible state:** n/a
- **Expected outcome:** original food imagery is **not retained
  indefinitely** — a defined retention window applies, after which originals
  are deleted (thumbnails/derived copies follow their own documented policy).
  Metadata stripped at upload (SCAN-03).
- **Failure outcome:** n/a (system guarantee)
- **Acceptance examples:**
  - Given a meal photo uploaded on day 1, When the retention window passes,
    Then the original is purged automatically

---

## SAFE-06: AI improvement consent

- **Actor:** user
- **Trigger:** settings toggle "Help improve food recognition"
- **Preconditions:** consent UI available (P-SAFE-1)
- **Action:** user enables or disables
- **Visible state:** a clearly worded, optional toggle
- **Expected outcome:** when enabled, corrections and imagery used for model
  improvement are anonymized and metadata-stripped; provenance of every
  sample is maintained; withdrawal stops future use and (where feasible)
  excludes the user's data from subsequent training runs. When disabled or
  unset, the user's data is **never** silently used for training.
- **Failure outcome:** n/a (default-off)
- **Acceptance examples:**
  - Given the toggle off (default), When the user logs meals for a month,
    Then none of that data enters any model-improvement pipeline

---

## SAFE-07: Correction capture & admin review

- **Actor:** user (corrects AI); admins (review)
- **Trigger:** any user correction of AI output (low-confidence picks,
  edit-before-save changes, post-save edits)
- **Preconditions:** consent where required (SAFE-06 / SAFE-03)
- **Action:** user corrects; system records
- **Visible state:** n/a to the user; admins see a review queue
- **Expected outcome:** each correction records: AI prediction, user
  correction, food, portion, model version, prompt version, timestamp. An
  admin review system exists to inspect and act on these (admin app — Master
  §53). Corrections feed quality analytics but never personal identity.
- **Failure outcome:** n/a (best-effort capture; must not block saving)
- **Acceptance examples:**
  - Given the AI proposed "Shiro Wot" and the user selected "Misir Wot" in the
    low-confidence flow, When the meal saves, Then a correction record exists
    linking the prediction, the choice, and the current model/prompt versions
