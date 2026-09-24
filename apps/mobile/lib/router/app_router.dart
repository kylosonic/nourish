import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_domain/domain.dart';

import '../features/auth/sign_in_screen.dart';
import '../features/history/meal_history_screen.dart';
import '../features/home/home_shell.dart';
import '../features/insights/insights_screen.dart';
import '../features/onboarding/daily_target_screen.dart';
import '../features/onboarding/steps/activity_step.dart';
import '../features/onboarding/steps/body_step.dart';
import '../features/onboarding/steps/food_preference_step.dart';
import '../features/onboarding/steps/goal_step.dart';
import '../features/onboarding/steps/language_step.dart';
import '../features/onboarding/steps/pace_step.dart';
import '../features/profile/profile_screen.dart';
import '../features/progress/progress_screen.dart';
import '../features/recommendations/what_can_i_eat_screen.dart';
import '../features/scan/photo_capture_screen.dart';
import '../features/scan/scan_flow_screen.dart';
import '../features/scan/text_log_screen.dart';
import '../features/search/food_search_screen.dart';
import '../features/splash/splash_screen.dart';
import '../features/voids/honest_void_screen.dart';
import '../features/weight/weight_screen.dart';
import '../features/welcome/welcome_screen.dart';
import 'routes.dart';

/// First unanswered onboarding route (ONB-09 resume).
///
/// `currentOnboardingStep` stores the number of completed counted steps
/// (0..T). Counted steps (blueprint §10 runtime-computed counters):
/// Language → Goal → Body → Activity → [Pace only when goal = lose
/// weight] → Food preference. Welcome and the daily-target summary carry
/// no counter. Completed onboarding resolves to `/home`.
String firstUnansweredRoute(UserProfile profile) {
  if (profile.onboardingComplete) {
    return AppRoutes.home;
  }
  final List<String> steps = <String>[
    AppRoutes.onboardingLanguage,
    AppRoutes.onboardingGoal,
    AppRoutes.onboardingBody,
    AppRoutes.onboardingActivity,
    if (profile.goal == Goal.loseWeight) AppRoutes.onboardingPace,
    AppRoutes.onboardingFoodPreference,
  ];
  final int step = profile.currentOnboardingStep;
  if (step <= 0) {
    return AppRoutes.welcome;
  }
  if (step >= steps.length) {
    return AppRoutes.onboardingDailyTarget;
  }
  return steps[step];
}

/// Builds the S0 GoRouter.
///
/// Redirect rules (blueprint §10): `/` resolves to the resume point
/// (onboarding incomplete → first unanswered step; complete → `/home`);
/// app-only routes are blocked until onboarding completes. `/welcome` is
/// freely reachable so the language step's back control can exit
/// onboarding to welcome (ONB-09); launch-time resume is handled by
/// bootstrap's `initialLocation`, not by bouncing explicit navigation.
/// [profileNotifier] is seeded by bootstrap and updated when the flow
/// finishes, so the redirect stays live for the session.
GoRouter buildAppRouter({required ValueNotifier<UserProfile> profileNotifier}) {
  // Screens that need a finished profile. Sign-in is deliberately NOT here: it
  // depends on nothing local, and a returning user must be able to open it from
  // the welcome screen before setup on this device is done.
  const Set<String> gatedLocations = <String>{
    AppRoutes.home,
    AppRoutes.progress,
    AppRoutes.insights,
    AppRoutes.profile,
    AppRoutes.history,
    AppRoutes.searchFood,
    AppRoutes.weight,
    AppRoutes.whatCanIEat,
  };

  return GoRouter(
    initialLocation: firstUnansweredRoute(profileNotifier.value),
    redirect: (BuildContext context, GoRouterState state) {
      final UserProfile profile = profileNotifier.value;
      final String target = firstUnansweredRoute(profile);
      final String location = state.matchedLocation;

      if (location == AppRoutes.splash) {
        return location == target ? null : target;
      }
      if (!profile.onboardingComplete && gatedLocations.contains(location)) {
        return target;
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutes.splash,
        builder: (BuildContext context, GoRouterState state) =>
            const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.welcome,
        builder: (BuildContext context, GoRouterState state) =>
            const WelcomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingLanguage,
        builder: (BuildContext context, GoRouterState state) =>
            const LanguageStepScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingGoal,
        builder: (BuildContext context, GoRouterState state) =>
            const GoalStepScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingBody,
        builder: (BuildContext context, GoRouterState state) =>
            const BodyStepScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingActivity,
        builder: (BuildContext context, GoRouterState state) =>
            const ActivityStepScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingPace,
        builder: (BuildContext context, GoRouterState state) =>
            const PaceStepScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingFoodPreference,
        builder: (BuildContext context, GoRouterState state) =>
            const FoodPreferenceStepScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboardingDailyTarget,
        builder: (BuildContext context, GoRouterState state) =>
            const DailyTargetScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (BuildContext context, GoRouterState state) =>
            const HomeShell(),
      ),
      GoRoute(
        path: AppRoutes.progress,
        builder: (BuildContext context, GoRouterState state) =>
            const ProgressScreen(),
      ),
      GoRoute(
        path: AppRoutes.insights,
        builder: (BuildContext context, GoRouterState state) =>
            const InsightsScreen(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (BuildContext context, GoRouterState state) =>
            const ProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.history,
        builder: (BuildContext context, GoRouterState state) =>
            const MealHistoryScreen(),
      ),
      GoRoute(
        path: AppRoutes.searchFood,
        builder: (BuildContext context, GoRouterState state) =>
            const FoodSearchScreen(),
      ),
      GoRoute(
        path: AppRoutes.weight,
        builder: (BuildContext context, GoRouterState state) =>
            const WeightScreen(),
      ),
      GoRoute(
        path: AppRoutes.whatCanIEat,
        builder: (BuildContext context, GoRouterState state) =>
            const WhatCanIEatScreen(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        builder: (BuildContext context, GoRouterState state) =>
            const SignInScreen(),
      ),
      // S2 scan flow: transactional screens, the navigation shell is suppressed.
      GoRoute(
        path: AppRoutes.textLog,
        builder: (BuildContext context, GoRouterState state) =>
            const TextLogScreen(),
      ),
      GoRoute(
        path: AppRoutes.scanFlow,
        builder: (BuildContext context, GoRouterState state) =>
            const ScanFlowScreen(),
      ),
      GoRoute(
        path: AppRoutes.photoCapture,
        builder: (BuildContext context, GoRouterState state) =>
            const PhotoCaptureScreen(),
      ),
      GoRoute(
        path: AppRoutes.honestVoid,
        builder: (BuildContext context, GoRouterState state) =>
            HonestVoidScreen(
              featureId: state.pathParameters['feature'] ?? 'unknown',
            ),
      ),
    ],
  );
}
