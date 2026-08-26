# Scan & AI Analysis Behaviors (SCAN)

Sources: `Design/scan_menu`, `Design/camera_screen`, `Design/ai_analysis_screen`,
`Design/ai_result_screen`, `Design/low_confidence_state`, Master §3, §15–§17, §22–§23.

This is the signature product loop:
**Scan → Camera → AI Analysis → Food Detection → Ethiopian Food Retrieval →
Portion Estimation → Nutrition Calculation → User Confirmation → Meal Saved →
Dashboard Updated.** It must be one of the fastest, most polished flows in the
app. All screens in this flow are transactional: the navigation shell is
suppressed.

---

## SCAN-01: Scan menu

- **Actor:** signed-in user
- **Trigger:** Scan center button from the nav shell, or a "Not logged" meal
  slot (HOME-03)
- **Preconditions:** active session
- **Action:** choose an entry method
- **Visible state:** bottom sheet over dimmed current screen, drag handle,
  title "What did you eat?", close control; a grid of six options:
  **TAKE PHOTO**, **CHOOSE PHOTO**, **DESCRIBE MEAL**, **USE VOICE**,
  **SEARCH FOOD**, **SCAN BARCODE**
- **Expected outcome:** each option routes as follows:
  - TAKE PHOTO → camera capture (SCAN-02)
  - CHOOSE PHOTO → device gallery picker, then straight to analysis (SCAN-04)
  - DESCRIBE MEAL → text logging (LOG-01)
  - USE VOICE → voice logging (LOG-02)
  - SEARCH FOOD → food search (LOG-05)
  - SCAN BARCODE → barcode scan (LOG-03)
- **Failure outcome:** camera unavailable (denied permission, no hardware) →
  CHOOSE PHOTO remains usable and the reason is explained once
- **Edge cases:**
  - If launched from a meal slot, the eventual save is scoped to that slot
  - Closing the sheet (drag down / tap outside / X) returns exactly to the
    prior screen with no state change
- **Acceptance examples:**
  - Given Home with the scan menu open, When the user taps TAKE PHOTO, Then the
    camera screen opens in capture mode
  - Given the scan menu, When the user swipes it down, Then Home is unchanged

---

## SCAN-02: Camera capture

- **Actor:** signed-in user
- **Trigger:** TAKE PHOTO from scan menu
- **Preconditions:** camera permission granted (prompt shown on first use if
  not yet decided)
- **Action:** frame the meal, tap the shutter
- **Visible state:** full-bleed live camera; top: close (X), instruction pill
  "Fit your whole meal in the frame"; center: corner-bracket framing guide +
  subtle reticle; bottom: gallery thumbnail (left), shutter (center, emerald
  inner circle with white outer ring), flash toggle (right)
- **Expected outcome:** shutter captures one image and proceeds to analysis
  (SCAN-04). Flash toggles on/off. The gallery thumbnail opens the device
  gallery to choose an existing photo (which then also proceeds to SCAN-04).
- **Failure outcome:**
  - Permission denied permanently → clear explanation + alternative to use
    CHOOSE PHOTO or the app settings
  - Capture hardware failure → message with retry; the app never fakes a capture
- **Edge cases:**
  - Close (X) cancels the whole flow and returns to the prior screen; nothing
    is saved
  - The framing guide is guidance only — capture is not blocked if the meal
    does not fill the frame
- **Acceptance examples:**
  - Given the camera screen, When the user taps the shutter, Then the capture
    flows immediately into AI analysis
  - Given the camera screen, When the user taps X, Then the scan menu origin
    screen reappears with no meal logged

---

## SCAN-03: Image upload preparation (system rule)

- **Actor:** backend (system rule)
- **Trigger:** a photo is submitted for analysis
- **Preconditions:** photo captured/chosen
- **Action:** system prepares the image for transport
- **Visible state:** n/a
- **Expected outcome:** images are compressed before upload; exchangeable
  metadata (GPS, device, timestamps) is stripped; the analysis uses the
  compressed copy. Original full-resolution imagery is not retained
  indefinitely (SAFE-05).
- **Failure outcome:** upload failure → analysis never starts; the user gets
  a retry screen (SCAN-04 failure state)
- **Acceptance examples:**
  - Given a captured photo with GPS metadata, When submitted for analysis,
    Then the stored/transmitted image contains no location metadata

---

## SCAN-04: AI analysis progression

- **Actor:** signed-in user (passive observer)
- **Trigger:** photo submitted (camera or gallery)
- **Preconditions:** image uploaded
- **Action:** wait
- **Visible state:** the submitted photo blurred as backdrop; centered pulsing
  scanner animation; a status list that animates through three stages:
  1. **Finding foods...** (active)
  2. **Estimating portions...**
  3. **Calculating nutrition...**
  Footer: "POWERED BY NOURISH INTELLIGENCE"
- **Expected outcome:** when all stages complete, the result screen (SCAN-05)
  opens, or the low-confidence screen (SCAN-06) when overall confidence is
  Low. The user never has to act to advance.
- **Failure outcome:**
  - Analysis times out or fails → message "We couldn't analyze this photo"
    with **Retry** and **Cancel**; Retry re-submits the same image
  - Unreadable image (too dark / no food detectable) → the same failure
    screen with a plain-language reason; never a fabricated result
- **Edge cases:**
  - Each stage represents a real pipeline step; the UI may run faster than
    the animation — the animation must complete its sequence without lying
    about which steps ran
  - The screen must not be dismissible mid-analysis by accident; a deliberate
    close cancels the run and returns to the prior screen
- **Acceptance examples:**
  - Given a submitted photo, When analysis runs, Then the three statuses
    appear in order and the result screen follows
  - Given a submitted photo of a blank table, When analysis runs, Then the
    failure state appears with a retry option and no meal data

---

## SCAN-05: AI result & confirmation

- **Actor:** signed-in user
- **Trigger:** analysis completed with Medium or High overall confidence
- **Preconditions:** structured analysis result received and validated
  (system rule: malformed AI output is rejected, never shown)
- **Action:** review, optionally adjust, then confirm or edit
- **Visible state:** header with close (X); meal photo with a "SCAN COMPLETE"
  badge; confidence row "AI CONFIDENCE — HIGH (94%)" with an **ADJUST**
  control; **Meal Summary** (total kcal + protein/carbs/fat with bars);
  **DETECTED INGREDIENTS** list — each item shows name, description, portion
  (grams), "~ kcal"; primary **CONFIRM MEAL**, secondary **EDIT**
- **Expected outcome:**
  - CONFIRM MEAL saves the meal with its nutrition snapshot (TGT-04) and
    returns to the origin screen, which now shows updated progress (HOME-02)
  - EDIT opens the meal editing experience (SCAN-07)
  - ADJUST opens editing of the detected items (same destination as EDIT —
    resolve in SCAN-07)
- **Failure outcome:** save failure → the confirmed meal is not lost; a retry
  appears with the data intact
- **Edge cases:**
  - Confidence is per-item as well as overall (SCAN-06 covers low-confidence
    *items*)
  - kcal figures here are estimates derived from the nutrition engine (TGT-03),
    displayed with the "~" affordance to signal estimates, per Master §71
    (never present AI estimates as exact)
  - Closing (X) before confirm discards the run; a discard confirm prompt is
    shown so an accidental tap does not lose the analysis
- **Acceptance examples:**
  - Given a High-confidence result (Injera 120g, Doro Wot 220g, Salad 80g),
    When the user taps CONFIRM MEAL, Then the meal is saved with total 820 kcal
    and Home reflects the update
  - Given the result screen, When the user taps X, Then a "Discard this
    analysis?" prompt appears before anything is discarded

---

## SCAN-06: Low confidence resolution

- **Actor:** signed-in user
- **Trigger:** overall confidence Low (or the user reports uncertainty)
- **Preconditions:** analysis produced candidate foods below the confidence
  threshold
- **Action:** pick a candidate, or search manually
- **Visible state:** the photo blurred with a "Low Confidence" warning badge;
  headline **"We're not completely sure."**; sub-copy "Which one of these
  looks right?"; candidate cards (photo, name, description, **SELECT**);
  secondary **SEARCH MANUALLY**
- **Expected outcome:**
  - SELECT on a candidate continues the flow with that food at a
    re-estimated portion → the result/confirmation screen (SCAN-05 behavior)
  - SEARCH MANUALLY opens food search (LOG-05) so the user can pick the real
    food; the chosen food continues the same flow
- **Failure outcome:** if no candidate is chosen, the flow can be cancelled
  without saving
- **Edge cases:**
  - Candidate lists always include an escape hatch to search — the design
    shows three candidates, but any number may appear, and "none of these"
    must always be reachable
  - The user's choice here is captured as a correction for quality analytics
    (SAFE-07)
- **Acceptance examples:**
  - Given a low-confidence stew photo, When candidates are shown (Shiro Wot,
    Misir Wot, Kik Alicha), Then the user can SELECT Misir Wot and reach
    confirmation with Misir Wot as the item
  - Given the low-confidence screen, When the user taps SEARCH MANUALLY, Then
    food search opens with the analysis context retained

---

## SCAN-07: Edit before save

- **Actor:** signed-in user
- **Trigger:** EDIT / ADJUST from the result screen, or item change from
  low-confidence flow
- **Preconditions:** analysis result present
- **Action:** modify items and portions, then save
- **Visible state:** the meal editing experience (screen not yet designed —
  P-SCAN-1). At minimum it must expose: per-item identity (swap food), portion
  amount/unit, remove item, add item, and a live-updating total
- **Expected outcome:** edits are reflected in the meal summary before
  saving; saving stores the user-confirmed values and the nutrition snapshot
  of those values (TGT-04). Edits are captured for quality analytics when the
  user has consented (SAFE-07).
- **Failure outcome:** if an edited food cannot be resolved to nutrition data,
  the item is flagged and cannot be saved until fixed or removed
- **Edge cases:**
  - Changing a portion re-computes nutrition deterministically (TGT-03); it
    never re-invokes the AI
  - Swap-to-food uses food search (LOG-05)
- **Acceptance examples:**
  - Given the result shows Doro Wot 220g, When the user edits it to 110g,
    Then the summary recalcs to ~255 kcal for that item before saving
  - Given the editor, When the user removes the Salad item, Then the meal
    total drops by ~130 kcal and the saved meal excludes Salad
