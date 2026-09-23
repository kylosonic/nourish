import 'package:drift/drift.dart';
import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../tables/tables.dart';

part 'profile_dao.g.dart';

/// Singleton-profile access: exactly one `user_profile` row per install,
/// created lazily. Bridges table rows to the domain [UserProfile] model.
@DriftAccessor(tables: [UserProfileTable])
class ProfileDao extends DatabaseAccessor<AppDatabase> with _$ProfileDaoMixin {
  ProfileDao(super.db);

  /// Ensures the singleton row exists and returns the current profile.
  Future<UserProfile> getOrCreate() async {
    final UserProfileRow? row = await (select(
      userProfileTable,
    )..limit(1)).getSingleOrNull();
    if (row == null) {
      await into(userProfileTable).insert(UserProfileTableCompanion.insert());
      return const UserProfile(language: AppLanguage.en);
    }
    return _profileFromRow(row);
  }

  /// Emits the current profile (null before first creation, which is
  /// effectively never once bootstrap has run).
  Stream<UserProfile?> watchProfile() => (select(userProfileTable)..limit(1))
      .watchSingleOrNull()
      .map((UserProfileRow? row) => row == null ? null : _profileFromRow(row));

  /// Number of completed counted onboarding steps.
  Future<int> currentOnboardingStep() async {
    final UserProfileRow? row = await (select(
      userProfileTable,
    )..limit(1)).getSingleOrNull();
    return row?.currentOnboardingStep ?? 0;
  }

  /// Persists the onboarding resume position (ONB-09).
  Future<void> setCurrentOnboardingStep(int step) async {
    await (update(userProfileTable)).write(
      UserProfileTableCompanion(
        currentOnboardingStep: Value(step),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Persists the user's own daily water goal (WW-01), touching nothing else.
  ///
  /// Ensures the singleton row exists first: a bare `UPDATE` against a missing
  /// row would report success and change nothing, which is the one outcome the
  /// user must never get from a settings control.
  Future<void> setWaterTargetMl(int targetMl) async {
    await getOrCreate();
    await (update(userProfileTable)).write(
      UserProfileTableCompanion(
        waterTargetMl: Value(targetMl),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Writes every profile field (singleton row replace-by-value).
  ///
  /// Named `saveProfile` (not `update`) to avoid colliding with drift's
  /// generic `update` helper.
  Future<void> saveProfile(UserProfile profile) async {
    await (update(userProfileTable)).write(
      UserProfileTableCompanion(
        language: Value(profile.language.name),
        goal: Value(profile.goal?.name),
        sex: Value(profile.sex?.name),
        age: Value(profile.age),
        heightCm: Value(profile.heightCm),
        currentWeightKg: Value(profile.currentWeightKg),
        targetWeightKg: Value(profile.targetWeightKg),
        activity: Value(profile.activity?.name),
        pace: Value(profile.pace?.name),
        foodPreference: Value(profile.foodPreference?.name),
        waterTargetMl: Value(profile.waterTargetMl),
        onboardingComplete: Value(profile.onboardingComplete),
        currentOnboardingStep: Value(profile.currentOnboardingStep),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  UserProfile _profileFromRow(UserProfileRow row) {
    return UserProfile(
      language: AppLanguage.values.byName(row.language),
      goal: row.goal == null ? null : Goal.values.byName(row.goal!),
      sex: row.sex == null ? null : Sex.values.byName(row.sex!),
      age: row.age,
      heightCm: row.heightCm,
      currentWeightKg: row.currentWeightKg,
      targetWeightKg: row.targetWeightKg,
      activity: row.activity == null
          ? null
          : Activity.values.byName(row.activity!),
      pace: row.pace == null ? null : Pace.values.byName(row.pace!),
      foodPreference: row.foodPreference == null
          ? null
          : FoodPreference.values.byName(row.foodPreference!),
      waterTargetMl: row.waterTargetMl,
      onboardingComplete: row.onboardingComplete,
      currentOnboardingStep: row.currentOnboardingStep,
    );
  }
}
