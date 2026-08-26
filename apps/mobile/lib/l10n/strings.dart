import '../core/date_utils.dart';

/// S0 English string table — the single source for UI copy (PPA-6:
/// strings ship in English; this table is the i18n seam for S1+).
///
/// Every user-facing string used by a screen lives here. Screens never
/// hardcode copy.
abstract final class Strings {
  static const String appName = 'Nourish';
  static const String tagline = 'Nutrition, understood.';

  /// Provisional seed disclaimer (ADR-0004(e), blueprint §11): seed
  /// values are never presented as authoritative.
  static const String seedDisclaimer =
      'Provisional values — authoritative Ethiopian FCT 2025 data ships '
      'in a coming update.';

  // Shared action labels.
  static const String continueLabel = 'Continue';
  static const String nextLabel = 'Next';
  static const String skipLabel = 'Skip';
  static const String backTooltip = 'Go back';
  static const String goBackLabel = 'GO BACK';
  static const String closeTooltip = 'Close';

  /// Onboarding step counter (blueprint §10: runtime-computed absolute
  /// counters over counted steps only).
  static String stepOf(int step, int total) => 'STEP $step OF $total';

  // Welcome (ONB-01).
  static const String welcomeTitle = 'Eat smarter. Understand your food.';
  static const String welcomeSubtitle =
      'AI-powered nutrition tracking built for the way you eat.';
  static const String getStarted = 'GET STARTED';
  static const String alreadyHaveAccount = 'I ALREADY HAVE AN ACCOUNT';

  // Language (ONB-02).
  static const String languageTitle = 'Language';
  static const String languageSubtitle =
      'Select your preferred language for the Nourish experience.';
  static const String languageEnglish = 'English';
  static const String languageAmharic = 'አማርኛ';
  static const String languageAmharicRoman = 'Amharic';
  static const String languageOromo = 'Afaan Oromoo';
  static const String languageOromoRoman = 'Afaan Oromo';

  // Goal (ONB-03).
  static const String goalTitle = 'What is your goal?';
  static const String goalSubtitle = 'Select one to help us personalize your plan.';
  static const String goalLoseWeight = 'Lose weight';
  static const String goalBuildMuscle = 'Build muscle';
  static const String goalMaintainWeight = 'Maintain weight';
  static const String goalEatHealthier = 'Eat healthier';

  // Body information (ONB-04).
  static const String bodyTitle = 'Your body';
  static const String biologicalSex = 'Biological sex';
  static const String sexFemale = 'Female';
  static const String sexMale = 'Male';
  static const String ageLabel = 'Age';
  static const String heightLabel = 'Height';
  static const String currentWeightLabel = 'Current weight';
  static const String targetWeightLabel = 'Target weight';
  static const String ageHint = 'e.g. 30';
  static const String heightHint = 'e.g. 170';
  static const String weightHint = 'e.g. 70';
  static const String unitYears = 'yrs';
  static const String unitCm = 'cm';
  static const String unitKg = 'kg';
  static const String errorAgeRange = 'Enter an age between 18 and 100.';
  static const String errorHeightRange =
      'Enter a height between 100 and 250 cm.';
  static const String errorWeightRange =
      'Enter a weight between 30 and 350 kg.';

  // Activity level (ONB-05).
  static const String activityTitle = 'Activity level';
  static const String activitySubtitle =
      'How active are you on a typical day?';
  static const String activitySedentary = 'Sedentary';
  static const String activitySedentaryDesc =
      'Little to no exercise, desk job most of the day.';
  static const String activityLight = 'Light';
  static const String activityLightDesc =
      'Light exercise or sports 1-3 days a week.';
  static const String activityModerate = 'Moderate';
  static const String activityModerateDesc =
      'Moderate exercise or sports 3-5 days a week.';
  static const String activityVeryActive = 'Very active';
  static const String activityVeryActiveDesc =
      'Hard exercise or sports 6-7 days a week.';
  static const String activityAthlete = 'Athlete';
  static const String activityAthleteDesc =
      'Very hard daily exercise, physical job, or training twice a day.';

  // Preferred pace (ONB-06).
  static const String paceTitle = 'Preferred pace';
  static const String paceSubtitle =
      'Choose how quickly you\'d like to reach your goal. A steadier pace '
      'is often easier to maintain.';
  static const String paceConservative = 'Conservative';
  static const String paceConservativeDesc =
      'Gentle approach, easier to adapt dietary habits over time.';
  static const String paceModerate = 'Moderate';
  static const String paceModerateDesc =
      'Balanced pace requiring consistent effort and tracking.';
  static const String paceAggressive = 'Aggressive';
  static const String paceAggressiveDesc =
      'Strict adherence needed. May feel restrictive.';
  static const String paceRecommended = 'Recommended';
  static const String paceRequiresDiscipline = 'Requires discipline';
  static const String paceKgPerWeek = 'kg / week';

  // Food preference (ONB-07).
  static const String foodPrefTitle = 'What do you usually eat?';
  static const String foodPrefSubtitle =
      'We\'ll use this to build your baseline nutritional targets and '
      'suggest relevant meals.';
  static const String prefEthiopian = 'Ethiopian';
  static const String prefEthiopianDesc =
      'Traditional dishes like Injera, wot, and tibs.';
  static const String prefMixed = 'Mixed';
  static const String prefMixedDesc =
      'A balance of traditional meals and modern preps.';
  static const String prefInternational = 'International';
  static const String prefInternationalDesc =
      'Global cuisine, pastas, salads, and proteins.';

  // Daily target summary (ONB-08).
  static const String yourDailyTarget = 'YOUR DAILY TARGET';
  static const String kcalUnit = 'kcal';
  static const String macroProtein = 'PROTEIN';
  static const String macroCarbs = 'CARBS';
  static const String macroFat = 'FAT';
  static const String startTracking = 'START TRACKING';
  static const String adjustNote = 'You can always adjust this in settings.';
  static const String targetUnavailableTitle = 'We couldn\'t compute your target';
  static const String targetUnavailableBody =
      'Something is missing from your answers, so no number is shown. '
      'Go back and check your details.';
  static const String targetLoading = 'Calculating your target…';

  // Navigation (PPA-5).
  static const String homeTab = 'Home';
  static const String progressTab = 'Progress';
  static const String scanTab = 'Scan';
  static const String insightsTab = 'Insights';
  static const String profileTab = 'Profile';

  // Home dashboard (HOME-01..04).
  static const String caloriesLeft = 'Calories Left';
  static const String caloriesOver = 'Over target';
  static const String waterTargetLiters = '3.0 L';
  static const String todayMeals = 'TODAY\'S MEALS';
  static const String seeAll = 'See All';
  static const String notLogged = 'Not logged';
  static const String hydration = 'Hydration';
  static const String add250ml = 'Add 250ml';
  static const String removeWaterTooltip = 'Remove 250ml';
  static const String waterSaveFailed =
      'Couldn\'t update water. Please try again.';
  static const String setupPromptTitle = 'Your daily target isn\'t set up yet';
  static const String setupPromptBody =
      'Finish onboarding to see your calories and macros.';
  static const String finishSetup = 'FINISH SETUP';
  static const String dashboardLoadFailed =
      'Couldn\'t load your target. Pull back later or restart the app.';
  static const String notificationsTitle = 'Notifications';

  /// Macro "left" pill copy, e.g. `Protein 95g left` (HOME-02).
  static String macroLeft(String name, String grams) => '$name ${grams}g left';

  // Greetings (HOME-01).
  static const String greetingMorning = 'Good morning';
  static const String greetingAfternoon = 'Good afternoon';
  static const String greetingEvening = 'Good evening';

  /// Greeting copy for a bucket.
  static String greetingFor(GreetingBucket bucket) {
    switch (bucket) {
      case GreetingBucket.morning:
        return greetingMorning;
      case GreetingBucket.afternoon:
        return greetingAfternoon;
      case GreetingBucket.evening:
        return greetingEvening;
    }
  }

  // Scan menu sheet (SCAN-01).
  static const String whatDidYouEat = 'What did you eat?';
  static const String scanSearchFood = 'Search food';
  static const String scanTakePhoto = 'Take photo';
  static const String scanChoosePhoto = 'Choose photo';
  static const String scanDescribeMeal = 'Describe meal';
  static const String scanUseVoice = 'Use voice';
  static const String scanBarcode = 'Scan barcode';

  // Food search (LOG-05).
  static const String searchFoodsTitle = 'Search Foods';
  static const String searchHint = 'Search for food (e.g., Injera, Shiro)...';
  static const String categoriesLabel = 'Categories';
  static const String allLabel = 'All';
  static const String commonLocalFoods = 'Common Local Foods';
  static const String typeToSearch = 'Type above to search our database.';
  static String noResultsFor(String query) => 'No foods match "$query".';
  static const String addFoodTooltip = 'Add food';
  static const String chooseSlotHint = 'Choose a meal slot';
  static const String addingTo = 'Adding to';
  static String addedToMeal(String foodName, String slot) =>
      'Added $foodName to $slot';
  static const String quickAddFailed = 'Couldn\'t add that food. Try again.';

  // Meal history (LOG-06).
  static const String dailySummary = 'Daily Summary';
  static const String caloriesCaps = 'CALORIES';
  static String ofTarget(String targetKcal) => 'OF $targetKcal';
  static const String logMeal = 'LOG MEAL';
  static const String noMealsForDay =
      'No meals logged for this day. Tap LOG MEAL to add one.';
  static const String historyTitle = 'Nourish';
  static const String calendarTooltip = 'Calendar';

  // Honest voids (ADR-0005).
  static const Set<String> honestVoidFeatures = {
    'sign-in',
    'take-photo',
    'choose-photo',
    'describe-meal',
    'use-voice',
    'scan-barcode',
  };

  /// Title-cased honest-void heading, e.g. `take-photo` → `Take photo`.
  static String honestVoidTitle(String feature) => feature
      .split('-')
      .map(
        (String word) => word.isEmpty
            ? word
            : '${word[0].toUpperCase()}${word.substring(1)}',
      )
      .join(' ');

  /// Per-feature honest copy; generic fallback for unknown ids.
  static String honestVoidBody(String feature) {
    switch (feature) {
      case 'sign-in':
        return 'Accounts and sign-in are coming soon. Nourish already '
            'works fully offline — your data stays on this phone.';
      case 'take-photo':
        return 'Photo analysis is coming soon. Until then you can search '
            'and log foods manually — it works fully offline.';
      case 'choose-photo':
        return 'Choosing a photo for analysis is coming soon. You can '
            'search and log foods manually right now, fully offline.';
      case 'describe-meal':
        return 'Describing a meal in words is coming soon. Search works '
            'today, fully offline.';
      case 'use-voice':
        return 'Voice logging is coming soon. Search works today, fully '
            'offline.';
      case 'scan-barcode':
        return 'Barcode scanning is coming soon. Search works today, '
            'fully offline.';
      case 'calendar':
        return 'The calendar picker is coming soon. The 7-day strip '
            'below covers the last few days.';
      default:
        return 'This feature is coming soon. It will work fully offline '
            '— nothing leaves your phone.';
    }
  }

  static const String searchFoodInstead = 'Search food instead';
  static const String continueWithoutAccount = 'Continue without an account';

  // Honest empty states (ADR-0005, P-HOME-3).
  static const String progressComingTitle = 'Progress is coming soon';
  static const String progressComingBody =
      'Charts and trends over your logged meals will live here. '
      'Everything stays on your phone.';
  static const String insightsComingTitle = 'Insights are coming soon';
  static const String insightsComingBody =
      'Personalized, offline insights about your eating patterns will '
      'live here.';
  static const String profileComingTitle = 'Profile is coming soon';
  static const String profileComingBody =
      'Your details, targets and settings will live here. Everything '
      'stays on your phone.';
}
