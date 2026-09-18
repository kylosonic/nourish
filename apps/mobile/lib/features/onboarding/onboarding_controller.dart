import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_domain/domain.dart';

import '../../data/repositories/onboarding_repository.dart';
import '../../data/repositories/target_repository.dart';
import '../../l10n/strings.dart';

/// The counted onboarding steps in canonical order (blueprint §10).
///
/// Welcome and the daily-target summary carry no counter. Pace is
/// counted only when the goal is [Goal.loseWeight] (PPA-2).
enum OnboardingStep { language, goal, body, activity, pace, foodPreference }

/// Transactional onboarding state: the answer draft (a [UserProfile]),
/// body-field validation errors, and persistence status.
class OnboardingState {
  const OnboardingState({
    this.profile,
    this.bodyErrors = const <String, String>{},
    this.isBusy = false,
    this.failureMessage,
    this.isLoaded = false,
  });

  /// The draft profile (loaded from persistence, then mutated by steps).
  final UserProfile? profile;

  /// Field-keyed body-step errors (age/height/currentWeight/targetWeight).
  final Map<String, String> bodyErrors;

  /// True while a Continue is persisting (buttons should disable).
  final bool isBusy;

  /// Set when a persist fails; cleared on the next successful persist.
  final String? failureMessage;

  /// True once [OnboardingController.load] has hydrated the draft.
  final bool isLoaded;

  OnboardingState copyWith({
    UserProfile? profile,
    Map<String, String>? bodyErrors,
    bool? isBusy,
    String? failureMessage,
    bool? isLoaded,
  }) {
    return OnboardingState(
      profile: profile ?? this.profile,
      bodyErrors: bodyErrors ?? this.bodyErrors,
      isBusy: isBusy ?? this.isBusy,
      failureMessage: failureMessage,
      isLoaded: isLoaded ?? this.isLoaded,
    );
  }
}

/// The real onboarding controller (replaces the Gate B parts 1-2
/// skeleton): step list per goal, draft answers, field validation,
/// persist-on-continue via [OnboardingRepository], resume support
/// (ONB-09), and daily-target derivation once the last counted step is
/// answered.
///
/// M1: dependencies are constructor-injected by the provider graph — the
/// controller no longer imports `providers.dart` (the file-level cycle is
/// gone). [profileNotifier] is the router's live profile view, injected
/// so the redirect stays live for the session (nullable in plain unit
/// containers).
class OnboardingController extends StateNotifier<OnboardingState> {
  OnboardingController(
    this._repository,
    this._targets,
    this._profileNotifier,
  ) : super(const OnboardingState());

  final OnboardingRepository _repository;
  final TargetRepository _targets;
  final ValueNotifier<UserProfile>? _profileNotifier;

  /// Counted steps for a goal (pace only for weight loss, PPA-2).
  static List<OnboardingStep> countedStepsFor(Goal? goal) {
    return <OnboardingStep>[
      OnboardingStep.language,
      OnboardingStep.goal,
      OnboardingStep.body,
      OnboardingStep.activity,
      if (goal == Goal.loseWeight) OnboardingStep.pace,
      OnboardingStep.foodPreference,
    ];
  }

  /// 1-based counter for a step (0 when the step is not in the flow).
  static int stepNumber(OnboardingStep step, Goal? goal) {
    final int index = countedStepsFor(goal).indexOf(step);
    return index < 0 ? 0 : index + 1;
  }

  /// Total counted steps (6 with pace, 5 without — blueprint §10).
  static int totalStepsFor(Goal? goal) => countedStepsFor(goal).length;

  /// Hydrates the draft from the persisted profile (resume, ONB-09).
  ///
  /// Pre-selected defaults become real draft values (Activity →
  /// Moderate; Pace → Moderate for the lose-weight goal): what the UI
  /// shows selected is what Continue persists — no silent defaulting.
  Future<void> load() async {
    if (state.isLoaded) {
      return;
    }
    UserProfile profile = await _repository.getOrCreate();
    if (profile.sex == null) {
      profile = profile.copyWith(sex: Sex.female);
    }
    if (profile.activity == null) {
      profile = profile.copyWith(activity: Activity.moderate);
    }
    if (profile.goal == Goal.loseWeight && profile.pace == null) {
      profile = _withPace(profile, Pace.moderate);
    }
    if (profile.foodPreference == null) {
      profile = profile.copyWith(foodPreference: FoodPreference.ethiopian);
    }
    state = state.copyWith(profile: profile, isLoaded: true);
  }

  UserProfile get _draft =>
      state.profile ?? const UserProfile(language: AppLanguage.en);

  void _update(UserProfile profile) => state = state.copyWith(profile: profile);

  void setLanguage(AppLanguage language) =>
      _update(_draft.copyWith(language: language));

  void setGoal(Goal goal) {
    // A pace only applies to weight loss (ONB-06): entering the loss
    // goal pre-selects Moderate; any other goal clears a previously
    // chosen pace. `copyWith` keeps current values on null, so the
    // pace field is rebuilt explicitly.
    _update(
      _withPace(
        _draft.copyWith(goal: goal),
        goal == Goal.loseWeight ? (_draft.pace ?? Pace.moderate) : null,
      ),
    );
  }

  void setSex(Sex sex) => _update(_draft.copyWith(sex: sex));

  /// Updates one body field from its raw text input (no clamping — the
  /// raw value is kept so out-of-range entries stay visible for the user
  /// to correct, ONB-04).
  void setBodyField(String field, String raw) {
    final String trimmed = raw.trim();
    final UserProfile profile = _draft;
    final UserProfile updated = switch (field) {
      'age' => profile.copyWith(age: int.tryParse(trimmed)),
      'height' => profile.copyWith(heightCm: double.tryParse(trimmed)),
      'currentWeight' => profile.copyWith(
          currentWeightKg: double.tryParse(trimmed)),
      'targetWeight' =>
        profile.copyWith(targetWeightKg: double.tryParse(trimmed)),
      _ => profile,
    };
    _update(updated);
  }

  /// Field-keyed validation messages (PPA-3 ranges; empty map = valid).
  Map<String, String> validateBody(UserProfile profile) {
    final Map<String, String> errors = <String, String>{};
    final int? age = profile.age;
    final double? heightCm = profile.heightCm;
    final double? currentWeightKg = profile.currentWeightKg;
    final double? targetWeightKg = profile.targetWeightKg;

    if (age == null || age < 18 || age > 100) {
      errors['age'] = Strings.errorAgeRange;
    }
    if (heightCm == null || heightCm < 100 || heightCm > 250) {
      errors['height'] = Strings.errorHeightRange;
    }
    if (currentWeightKg == null || currentWeightKg < 30 || currentWeightKg > 350) {
      errors['currentWeight'] = Strings.errorWeightRange;
    }
    if (targetWeightKg == null || targetWeightKg < 30 || targetWeightKg > 350) {
      errors['targetWeight'] = Strings.errorWeightRange;
    }
    return errors;
  }

  void setActivity(Activity activity) =>
      _update(_draft.copyWith(activity: activity));

  void setPace(Pace pace) => _update(_withPace(_draft, pace));

  /// Clears the draft pace (ONB-06 Skip: nothing recorded; the target
  /// engine applies its moderate default for weight loss).
  void skipPace() => _update(_withPace(_draft, null));

  void setFoodPreference(FoodPreference preference) =>
      _update(_draft.copyWith(foodPreference: preference));

  /// Rebuilds a profile with an explicit pace — `UserProfile.copyWith`
  /// keeps current values on null, so clearing needs a full rebuild.
  UserProfile _withPace(UserProfile profile, Pace? pace) {
    return UserProfile(
      language: profile.language,
      goal: profile.goal,
      sex: profile.sex,
      age: profile.age,
      heightCm: profile.heightCm,
      currentWeightKg: profile.currentWeightKg,
      targetWeightKg: profile.targetWeightKg,
      activity: profile.activity,
      pace: pace,
      foodPreference: profile.foodPreference,
      onboardingComplete: profile.onboardingComplete,
      currentOnboardingStep: profile.currentOnboardingStep,
    );
  }

  /// Persists the draft and advances the resume position
  /// (persist-on-continue, ONB-09). When the last counted step is
  /// persisted the daily target is derived (append-only, TGT-01).
  ///
  /// Returns true when the caller should navigate to the next step.
  Future<bool> continueFrom(OnboardingStep step) async {
    final UserProfile profile = _draft;
    if (step == OnboardingStep.body) {
      final Map<String, String> errors = validateBody(profile);
      if (errors.isNotEmpty) {
        state = state.copyWith(bodyErrors: errors);
        return false;
      }
      state = state.copyWith(bodyErrors: const <String, String>{});
    }

    state = state.copyWith(isBusy: true);
    try {
      await _repository.updateProfile(profile);
      final List<OnboardingStep> steps = countedStepsFor(profile.goal);
      final int completed = steps.indexOf(step) + 1;
      await _repository.setCurrentOnboardingStep(completed);
      if (completed == steps.length) {
        // Last counted step answered: derive + persist the daily target.
        await _targets.deriveAndSave(profile);
      }
      final UserProfile advanced = profile.copyWith(
        currentOnboardingStep: completed,
      );
      _syncProfileNotifier(advanced);
      state = state.copyWith(
        profile: advanced,
        isBusy: false,
        failureMessage: null,
      );
      return true;
    } catch (_) {
      state = state.copyWith(
        isBusy: false,
        failureMessage: 'Couldn\'t save your answers. Please try again.',
      );
      return false;
    }
  }

  /// Marks onboarding complete (START TRACKING, ONB-08) and keeps the
  /// router's live profile view in sync so `/home` stops redirecting.
  Future<bool> completeOnboarding() async {
    state = state.copyWith(isBusy: true);
    try {
      await _repository.completeOnboarding();
      final UserProfile profile = await _repository.getOrCreate();
      _syncProfileNotifier(profile);
      state = state.copyWith(
        profile: profile,
        isBusy: false,
        failureMessage: null,
      );
      return true;
    } catch (_) {
      state = state.copyWith(
        isBusy: false,
        failureMessage: 'Couldn\'t finish. Please try again.',
      );
      return false;
    }
  }

  /// Keeps the [ValueNotifier] driving GoRouter's redirect in sync with
  /// the persisted profile (injected during bootstrap and in tests;
  /// nullable so plain unit containers can run without it).
  void _syncProfileNotifier(UserProfile profile) {
    _profileNotifier?.value = profile;
  }
}
