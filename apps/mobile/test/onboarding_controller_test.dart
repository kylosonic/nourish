import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/features/onboarding/onboarding_controller.dart';
import 'package:nourish_mobile/providers.dart';
import 'package:nourish_mobile/router/app_router.dart';
import 'package:nourish_mobile/router/routes.dart';

import 'test_helpers.dart';

ProviderContainer _container(AppDatabase db) {
  final ProviderContainer container = ProviderContainer(
    overrides: <Override>[driftDatabaseProvider.overrideWithValue(db)],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  late AppDatabase db;

  setUp(() async {
    db = await openSeededDb();
  });

  tearDown(() async => db.close());

  group('OnboardingController (transactional wizard)', () {
    test('load hydrates the persisted profile (defaults: English)', () async {
      final OnboardingController controller = _container(db).read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      expect(controller.state.isLoaded, isTrue);
      expect(controller.state.profile?.language, AppLanguage.en);
      expect(controller.state.profile?.onboardingComplete, isFalse);
    });

    test('setGoal(loseWeight) keeps pace; other goals clear it (ONB-06)',
        () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      controller.setGoal(Goal.loseWeight);
      controller.setPace(Pace.aggressive);
      expect(controller.state.profile?.pace, Pace.aggressive);

      controller.setGoal(Goal.buildMuscle);
      expect(controller.state.profile?.pace, isNull);
    });

    test('validateBody flags missing and out-of-range values (ONB-04)',
        () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      // All missing → all four errors.
      expect(
        controller.validateBody(controller.state.profile!).keys,
        containsAll(<String>['age', 'height', 'currentWeight', 'targetWeight']),
      );

      // Age 12 (minor) and height 99 → errors; valid weights pass.
      controller.setGoal(Goal.loseWeight);
      controller.setSex(Sex.female);
      controller.setBodyField('age', '12');
      controller.setBodyField('height', '99');
      controller.setBodyField('currentWeight', '70');
      controller.setBodyField('targetWeight', '65');
      final Map<String, String> errors = controller.validateBody(
        controller.state.profile!,
      );
      expect(errors['age'], isNotNull);
      expect(errors['height'], isNotNull);
      expect(errors.containsKey('currentWeight'), isFalse);
      expect(errors.containsKey('targetWeight'), isFalse);

      // No silent clamping: the raw out-of-range value is kept.
      expect(controller.state.profile?.age, 12);
    });

    test('continueFrom(body) blocks on invalid and persists on valid',
        () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      controller.setGoal(Goal.loseWeight);
      controller.setBodyField('age', '12');
      final bool blocked = await controller.continueFrom(OnboardingStep.body);
      expect(blocked, isFalse);
      expect(controller.state.bodyErrors['age'], isNotNull);

      controller.setSex(Sex.female);
      controller.setBodyField('age', '30');
      controller.setBodyField('height', '170');
      controller.setBodyField('currentWeight', '70');
      controller.setBodyField('targetWeight', '65');
      final bool advanced = await controller.continueFrom(OnboardingStep.body);
      expect(advanced, isTrue);
      expect(controller.state.bodyErrors, isEmpty);
    });

    test('persist-on-continue updates the resume position (ONB-09)',
        () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      await controller.continueFrom(OnboardingStep.language);
      controller.setGoal(Goal.loseWeight);
      await controller.continueFrom(OnboardingStep.goal);

      // "Relaunch": a fresh container over the same DB resumes.
      final ProviderContainer second = _container(db);
      final OnboardingController resumed = second.read(
        onboardingControllerProvider.notifier,
      );
      await resumed.load();
      final UserProfile profile = resumed.state.profile!;
      expect(profile.language, AppLanguage.en);
      expect(profile.goal, Goal.loseWeight);
      expect(profile.currentOnboardingStep, 2);
      expect(
        firstUnansweredRoute(profile),
        AppRoutes.onboardingBody,
        reason: 'answers retained; resume at first unanswered step',
      );
    });

    test('skipPace records nothing; engine path still completes', () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      controller.setPace(Pace.aggressive);
      controller.skipPace();
      expect(controller.state.profile?.pace, isNull);
    });

    test('last counted step derives the daily target (engine output)',
        () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      controller.setLanguage(AppLanguage.en);
      controller.setGoal(Goal.loseWeight);
      controller.setSex(Sex.female);
      controller.setBodyField('age', '30');
      controller.setBodyField('height', '170');
      controller.setBodyField('currentWeight', '70');
      controller.setBodyField('targetWeight', '65');
      controller.setActivity(Activity.athlete);
      controller.setPace(Pace.aggressive);
      controller.setFoodPreference(FoodPreference.ethiopian);

      final bool ok = await controller.continueFrom(
        OnboardingStep.foodPreference,
      );
      expect(ok, isTrue);

      final DailyTarget? saved = await container
          .read(targetRepositoryProvider)
          .latest();
      final DailyTarget expected = TargetEngine().compute(
        const TargetEngineInput(
          sex: Sex.female,
          age: 30,
          heightCm: 170,
          weightKg: 70,
          goal: Goal.loseWeight,
          activity: Activity.athlete,
          pace: Pace.aggressive,
        ),
      );
      expect(saved, isNotNull);
      expect(saved!.targetKcal, expected.targetKcal);
      expect(controller.state.profile?.currentOnboardingStep, 6);
    });

    test('completeOnboarding flips the persisted flag (ONB-08)', () async {
      final ProviderContainer container = _container(db);
      final OnboardingController controller = container.read(
        onboardingControllerProvider.notifier,
      );
      await controller.load();

      final bool ok = await controller.completeOnboarding();
      expect(ok, isTrue);
      final UserProfile persisted = await container
          .read(onboardingRepositoryProvider)
          .getOrCreate();
      expect(persisted.onboardingComplete, isTrue);
    });

    test('counter strategy: T=6 with pace, T=5 without (blueprint §10)', () {
      expect(OnboardingController.totalStepsFor(Goal.loseWeight), 6);
      expect(OnboardingController.totalStepsFor(Goal.buildMuscle), 5);
      expect(
        OnboardingController.stepNumber(OnboardingStep.pace, Goal.loseWeight),
        5,
      );
      expect(
        OnboardingController.stepNumber(
          OnboardingStep.pace,
          Goal.buildMuscle,
        ),
        0,
        reason: 'pace is not in the non-loss flow',
      );
    });
  });
}
