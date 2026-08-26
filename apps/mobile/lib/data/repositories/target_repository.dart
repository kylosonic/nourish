import 'dart:developer' as developer;

import 'package:nourish_domain/domain.dart';

import '../database.dart';
import '../daos/target_dao.dart';

/// Daily-target derivation and append-only persistence (TGT-01).
///
/// All math lives in the domain `TargetEngine` — this repository only
/// translates profile answers into validated engine inputs and stores
/// what the engine returns. Re-derivation on any input change inserts a
/// new row; history is never rewritten.
class TargetRepository {
  TargetRepository(this._db, this._engine);

  final AppDatabase _db;
  final TargetEngine _engine;

  TargetDao get _targets => _db.targetDao;

  /// Builds engine inputs from profile answers.
  ///
  /// Returns null when any required onboarding field is missing — the
  /// engine must never guess (SAFE-01: fake numbers are refused, not
  /// invented).
  TargetEngineInput? inputFromProfile(UserProfile profile) {
    if (profile.goal == null ||
        profile.sex == null ||
        profile.age == null ||
        profile.heightCm == null ||
        profile.currentWeightKg == null ||
        profile.activity == null) {
      return null;
    }
    return TargetEngineInput(
      sex: profile.sex!,
      age: profile.age!,
      heightCm: profile.heightCm!,
      weightKg: profile.currentWeightKg!,
      goal: profile.goal!,
      activity: profile.activity!,
      pace: profile.pace,
    );
  }

  /// Derives a fresh target from the profile and persists it as a new
  /// append-only row. Returns null (and stores nothing) when the profile
  /// is incomplete.
  Future<DailyTarget?> deriveAndSave(UserProfile profile) async {
    final TargetEngineInput? input = inputFromProfile(profile);
    if (input == null) {
      return null;
    }
    final DailyTarget target = _engine.compute(input);
    await _targets.insertTarget(target);
    developer.log(
      'target derived: ${target.targetKcal} kcal (${target.formulaVersion})',
      name: 'target',
    );
    return target;
  }

  /// The active target (latest row).
  Future<DailyTarget?> latest() => _targets.latest();

  Stream<DailyTarget?> watchLatest() => _targets.watchLatest();

  /// Full append-only history, oldest first.
  Future<List<DailyTarget>> history() => _targets.all();
}
