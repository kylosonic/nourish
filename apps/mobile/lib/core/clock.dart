/// Injectable wall-clock seam (M3, blueprint S1 §12).
///
/// Everything that derives "today" reads the current time through a
/// [Clock] so tests can freeze a moment or cross midnight
/// deterministically; production wires the real wall clock.
library;

/// A function returning the current instant. The production default is
/// `DateTime.now`; tests override it with a fixed or scripted clock.
typedef Clock = DateTime Function();

/// The real wall clock (production default).
DateTime systemClock() => DateTime.now();
