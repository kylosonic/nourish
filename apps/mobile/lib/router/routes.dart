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

  /// WW-03 weight logging & trend (P-WW-2: dedicated screen undesigned, so the
  /// layout is provisional — PPA-13). Pushed from the Home dashboard card.
  static const String weight = '/weight';

  /// INS-03 "What can I eat" (P-INS-2: screen undesigned, so the layout is
  /// provisional — PPA-15). Pushed from the Home dashboard.
  static const String whatCanIEat = '/what-can-i-eat';

  /// S3 sign-in (P-AUTH-1: screens undesigned, so the layout is provisional —
  /// PPA-16). Pushed from the Profile tab's account card.
  static const String signIn = '/sign-in';
  static const String honestVoid = '/honest-void/:feature';

  /// S2 transactional scan flow (SCAN-01..07, LOG-01). These screens suppress
  /// the navigation shell: the user is inside one task until it is done or
  /// discarded.
  static const String textLog = '/scan/text';
  static const String scanFlow = '/scan/flow';

  /// Gallery/photograph acquisition (SCAN-01 → SCAN-03). Transactional: the
  /// picker is opened on entry and cancelling returns to the origin screen.
  static const String photoCapture = '/scan/photo';

  /// Parametrized honest void (ADR-0005 features: sign-in, take-photo,
  /// choose-photo, describe-meal, use-voice, scan-barcode).
  static String honestVoidFor(String feature) => '/honest-void/$feature';
}
