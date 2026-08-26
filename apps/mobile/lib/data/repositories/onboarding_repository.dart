import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../daos/profile_dao.dart';

/// Onboarding answer persistence and resume (ONB-09).
///
/// The single profile row holds every answered step; each Continue in the
/// real onboarding flow persists immediately so a mid-flow kill/relaunch
/// resumes at the first unanswered step (`firstUnansweredRoute`).
class OnboardingRepository {
  OnboardingRepository(this._db);

  final AppDatabase _db;

  ProfileDao get _profile => _db.profileDao;

  Stream<UserProfile?> watchProfile() => _profile.watchProfile();

  Future<UserProfile> getOrCreate() => _profile.getOrCreate();

  /// Number of completed counted onboarding steps (0..T).
  Future<int> currentOnboardingStep() => _profile.currentOnboardingStep();

  /// Persists the resume position.
  Future<void> setCurrentOnboardingStep(int step) =>
      _profile.setCurrentOnboardingStep(step);

  /// Writes the whole profile (used by every onboarding Continue).
  Future<void> updateProfile(UserProfile profile) =>
      _profile.saveProfile(profile);

  /// Marks onboarding finished (daily-target START TRACKING, ONB-08).
  Future<void> completeOnboarding() async {
    final UserProfile current = await getOrCreate();
    await _profile.saveProfile(current.copyWith(onboardingComplete: true));
  }
}
