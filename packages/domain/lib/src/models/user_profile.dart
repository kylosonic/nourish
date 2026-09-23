import 'activity.dart';
import 'food_preference.dart';
import 'goal.dart';
import 'language.dart';
import 'pace.dart';
import 'sex.dart';

/// The single persisted user profile (drift `user_profile` singleton row).
class UserProfile {
  const UserProfile({
    required this.language,
    this.goal,
    this.sex,
    this.age,
    this.heightCm,
    this.currentWeightKg,
    this.targetWeightKg,
    this.activity,
    this.pace,
    this.foodPreference,
    this.waterTargetMl,
    this.onboardingComplete = false,
    this.currentOnboardingStep = 0,
  });

  final AppLanguage language;
  final Goal? goal;
  final Sex? sex;
  final int? age;
  final double? heightCm;
  final double? currentWeightKg;
  final double? targetWeightKg;
  final Activity? activity;
  final Pace? pace;
  final FoodPreference? foodPreference;

  /// The user's own daily water goal in millilitres (WW-01), or null when they
  /// have never changed it — the app then uses its documented default.
  final int? waterTargetMl;

  /// True once onboarding has been completed at least once.
  final bool onboardingComplete;

  /// Index of the last answered onboarding step (ONB-09 resume).
  final int currentOnboardingStep;

  /// Returns a copy with the given fields replaced.
  ///
  /// Note: passing `null` keeps the current value; omit a parameter to
  /// leave the field unchanged.
  UserProfile copyWith({
    AppLanguage? language,
    Goal? goal,
    Sex? sex,
    int? age,
    double? heightCm,
    double? currentWeightKg,
    double? targetWeightKg,
    Activity? activity,
    Pace? pace,
    FoodPreference? foodPreference,
    int? waterTargetMl,
    bool? onboardingComplete,
    int? currentOnboardingStep,
  }) {
    return UserProfile(
      language: language ?? this.language,
      goal: goal ?? this.goal,
      sex: sex ?? this.sex,
      age: age ?? this.age,
      heightCm: heightCm ?? this.heightCm,
      currentWeightKg: currentWeightKg ?? this.currentWeightKg,
      targetWeightKg: targetWeightKg ?? this.targetWeightKg,
      activity: activity ?? this.activity,
      pace: pace ?? this.pace,
      foodPreference: foodPreference ?? this.foodPreference,
      waterTargetMl: waterTargetMl ?? this.waterTargetMl,
      onboardingComplete: onboardingComplete ?? this.onboardingComplete,
      currentOnboardingStep: currentOnboardingStep ?? this.currentOnboardingStep,
    );
  }
}
