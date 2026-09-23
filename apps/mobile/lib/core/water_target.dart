/// Water goal bounds and stepping (WW-01: "the daily target is user-adjustable
/// and applies to the current day onward").
///
/// P-WW-1 (a dedicated water screen) has no design, so the control is a
/// provisional stepper on the existing hydration card, recorded as PPA-14.
///
/// The bounds are deliberately wide rather than prescriptive: EFSA's adequate
/// intake for total water is about 2.0 L/day for women and 2.5 L/day for men,
/// and this app has no professional-input figure of its own (PPA-3). The range
/// therefore only rules out values that cannot be a daily goal at all — it does
/// not imply that any value inside it is a recommendation.
library;

/// The app's documented default when the user has never changed it (3.0 L,
/// blueprint §13). `WaterRepository.defaultTargetMl` is this same number, so
/// there is one default rather than two.
const int defaultWaterTargetMl = 3000;

/// Below this, a "daily goal" is not a hydration target any adult could hold.
const int minWaterTargetMl = 1500;

/// Above this, the app would be inviting water intake that needs medical
/// supervision, which it has no basis to do.
const int maxWaterTargetMl = 4000;

/// One step of the adjust control: a glass.
const int waterTargetStepMl = 250;

/// Move [currentMl] by [steps] glass-sized steps, clamped to the bounds.
int adjustWaterTargetMl(int currentMl, int steps) {
  final int next = currentMl + steps * waterTargetStepMl;
  if (next < minWaterTargetMl) return minWaterTargetMl;
  if (next > maxWaterTargetMl) return maxWaterTargetMl;
  return next;
}

/// Whether the control can still move in a given direction — the UI disables
/// the button rather than silently ignoring the tap.
bool canAdjustWaterTargetMl(int currentMl, int steps) =>
    adjustWaterTargetMl(currentMl, steps) != currentMl;
