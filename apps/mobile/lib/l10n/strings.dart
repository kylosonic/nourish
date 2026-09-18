import '../core/date_utils.dart';

/// S0 English string table — the single source for UI copy (PPA-6:
/// strings ship in English; this table is the i18n seam for S1+).
///
/// Every user-facing string used by a screen lives here. Screens never
/// hardcode copy.
abstract final class Strings {
  static const String appName = 'Nourish';
  static const String tagline = 'Nutrition, understood.';

  /// Bootstrap-cache disclaimer (ADR-0004(e), blueprint §11): shown until
  /// the first successful catalog sync; bootstrap values are never
  /// presented as authoritative.
  static const String seedDisclaimer =
      'Provisional values — authoritative Ethiopian FCT 2025 data ships '
      'in a coming update.';

  /// FCT 2025 citation footer (ADR-0006/D1 attribution), shown once the
  /// catalog has been synced to the authoritative data.
  static const String fctCitationFooter =
      'Nutrition values: Ethiopian Public Health Institute (EPHI) and '
      'Food and Agriculture Organization of the United Nations (FAO) '
      '2025. The Ethiopian Food Composition Table 2025. Addis Ababa, '
      'Ethiopia.';

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
      case 'notifications':
        return 'Notifications are coming soon. Everything still works '
            'fully offline — your data stays on this phone.';
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

  // ── S2: scan / analysis flow (SCAN-04..07, LOG-01) ────────────────────────

  // SCAN-04 analysis progression. Each label names a stage that really ran.
  static const String analysisTitle = 'Analysing your meal';
  static const String analysisStageFoods = 'Finding foods...';
  static const String analysisStagePortions = 'Estimating portions...';
  static const String analysisStageNutrition = 'Calculating nutrition...';
  static const String analysisPoweredBy = 'POWERED BY NOURISH INTELLIGENCE';

  // SCAN-04 failure states — plain language, never a fabricated result.
  static const String analysisFailedTitle = "We couldn't analyze this";
  static const String analysisFailed = 'Something went wrong. You can try again.';
  static const String analysisUnavailable =
      'Meal analysis is not available yet on this build. You can still '
      'search and log your food manually.';
  static const String analysisTimedOut =
      'The analysis took too long. Check your connection and try again.';
  static const String analysisMalformed =
      'The analysis came back in a form we could not trust, so nothing was '
      'saved. Please try again.';
  static const String analysisNoFood =
      'We could not find any food in that. Try a clearer photo, a shorter '
      'description, or search for the food instead.';
  static const String analysisUnreadableImage =
      'That image could not be read. Please choose a different photo.';
  static const String analysisImageTooLarge = 'That image is too large. Try a smaller one.';
  static const String analysisBusy = 'Too many analyses right now. Please try again shortly.';
  static const String retry = 'RETRY';
  static const String cancel = 'CANCEL';

  // SCAN-05 result.
  static const String scanComplete = 'SCAN COMPLETE';
  static const String aiConfidence = 'AI CONFIDENCE';
  static const String adjust = 'ADJUST';
  static const String mealSummary = 'Meal Summary';
  static const String detectedIngredients = 'DETECTED INGREDIENTS';
  static const String confirmMeal = 'CONFIRM MEAL';
  static const String edit = 'EDIT';
  static const String mealSaved = 'Meal saved';
  static const String saving = 'SAVING...';
  static const String estimateTooltip =
      'Estimated from your portion and the food database.';

  /// Confidence row copy: "AI CONFIDENCE — HIGH (94%)".
  static String confidenceLine(String state, int percent) =>
      '$aiConfidence — ${state.toUpperCase()} ($percent%)';

  /// "~ kcal" is the honest-estimate affordance (master §71).
  static String approximateKcal(int kcal) => '~ $kcal kcal';

  static String grams(double grams) =>
      grams >= 10 ? '${grams.round()} g' : '${grams.toStringAsFixed(1)} g';

  /// Warning row for an analysis item the local catalog could not resolve.
  static const String itemUnresolved =
      'Not in your offline food list — replace it or remove it before saving.';
  static const String replaceItem = 'REPLACE';

  // SCAN-05 discard prompt.
  static const String discardAnalysisTitle = 'Discard this analysis?';
  static const String discardAnalysisBody =
      'Nothing has been saved yet. Discarding loses the result.';
  static const String keepEditing = 'KEEP';
  static const String discard = 'DISCARD';

  // SCAN-06 low confidence.
  static const String lowConfidenceBadge = 'Low Confidence';
  static const String lowConfidenceTitle = "We're not completely sure.";
  static const String lowConfidenceBody = 'Which one of these looks right?';
  static const String select = 'SELECT';
  static const String searchManually = 'SEARCH MANUALLY';
  static const String noCandidates =
      'No close matches were found. Search for the food instead.';

  // SCAN-07 edit sheet.
  static const String editMealTitle = 'Edit meal';
  static const String portionLabel = 'PORTION';
  static const String addItemLabel = 'ADD ITEM';
  static const String removeItemTooltip = 'Remove item';
  static const String done = 'DONE';

  // LOG-01 text logging.
  static const String describeMealTitle = 'Describe your meal';
  static const String describeMealHint = 'e.g. 2 injera with shiro and an orange';
  static const String describeMealHelp =
      'Name the foods and rough amounts. Nourish matches them to the Ethiopian '
      'food database and shows you the result before anything is saved.';
  static const String analyseMeal = 'ANALYSE MEAL';
  static const String describeMealEmpty = 'Describe what you ate first.';

  // ── S5: in-app update check (REL-03) ─────────────────────────────────────
  static const String dismissTooltip = 'Dismiss';

  /// "New version available — 1.1.0".
  static String updateAvailableTitle(String version) =>
      'New version available — $version';

  static const String updateAvailableBody =
      'A newer Nourish is ready. The update opens in your browser; Nourish '
      'never installs anything by itself.';
  static const String downloadUpdate = 'DOWNLOAD UPDATE';
  static const String updateOpenFailed =
      'Could not open the browser. You can download the update from the Nourish website.';
}
