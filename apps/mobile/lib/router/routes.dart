/// Route path constants (blueprint §10).
///
/// The scan menu is intentionally NOT a route: it is a modal bottom sheet
/// over Home (HOME-05 overlay rule). Meal-slot context for `/search-food`
/// travels via `activeMealContextProvider`, not the URL.
abstract final class AppRoutes {
  static const String splash = '/';
  static const String welcome = '/welcome';
  static const String onboardingLanguage = '/onboarding/language';
  static const String onboardingGoal = '/onboarding/goal';
  static const String onboardingBody = '/onboarding/body';
  static const String onboardingActivity = '/onboarding/activity';
  static const String onboardingPace = '/onboarding/pace';
  static const String onboardingFoodPreference = '/onboarding/food-preference';
  static const String onboardingDailyTarget = '/onboarding/daily-target';
  static const String home = '/home';
  static const String progress = '/progress';
  static const String insights = '/insights';
  static const String profile = '/profile';
  static const String history = '/history';
  static const String searchFood = '/search-food';
  static const String honestVoid = '/honest-void/:feature';

  /// Parametrized honest void (ADR-0005 features: sign-in, take-photo,
  /// choose-photo, describe-meal, use-voice, scan-barcode).
  static String honestVoidFor(String feature) => '/honest-void/$feature';
}
