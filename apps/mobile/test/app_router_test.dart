import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/router/app_router.dart';
import 'package:nourish_mobile/router/routes.dart';

void main() {
  const UserProfile fresh = UserProfile(language: AppLanguage.en);

  group('firstUnansweredRoute (ONB-09 resume)', () {
    test('nothing answered → welcome', () {
      expect(firstUnansweredRoute(fresh), AppRoutes.welcome);
    });

    test('completed onboarding → home', () {
      const UserProfile done = UserProfile(
        language: AppLanguage.en,
        onboardingComplete: true,
        currentOnboardingStep: 6,
      );
      expect(firstUnansweredRoute(done), AppRoutes.home);
    });

    test('loss goal walks through the pace step', () {
      const UserProfile p = UserProfile(
        language: AppLanguage.en,
        goal: Goal.loseWeight,
        currentOnboardingStep: 5,
      );
      expect(
        firstUnansweredRoute(p),
        AppRoutes.onboardingFoodPreference,
        reason: 'steps 1-5 done (incl. pace) → food preference next',
      );

      const UserProfile mid = UserProfile(
        language: AppLanguage.en,
        goal: Goal.loseWeight,
        currentOnboardingStep: 4,
      );
      expect(firstUnansweredRoute(mid), AppRoutes.onboardingPace);
    });

    test('non-loss goal skips the pace step', () {
      const UserProfile p = UserProfile(
        language: AppLanguage.en,
        goal: Goal.buildMuscle,
        currentOnboardingStep: 4,
      );
      expect(firstUnansweredRoute(p), AppRoutes.onboardingFoodPreference);
    });

    test('all counted steps done → daily target summary', () {
      const UserProfile p = UserProfile(
        language: AppLanguage.en,
        goal: Goal.maintainWeight,
        currentOnboardingStep: 5,
      );
      expect(firstUnansweredRoute(p), AppRoutes.onboardingDailyTarget);
    });
  });
}
