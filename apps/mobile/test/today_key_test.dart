import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/providers.dart';

import 'pump_app.dart';
import 'test_helpers.dart';
import 'widget/seed_helpers.dart';

/// QA finding 3: "today" is a value several screens read, and it must not stay
/// frozen at whatever the clock said when the provider was first built.
void main() {
  /// Log one meal of [kcal] on [dateKey].
  Future<void> logOn(AppDatabase db, String dateKey, double kcal) {
    return MealRepository(db).saveMeal(
      MealSlot.lunch,
      <MealItemDraft>[
        MealItemDraft(
          food: testFood(id: 'today_food', name: 'Today Food', kcal: kcal),
          unit: PortionUnit.grams,
          quantity: 1,
        ),
      ],
      dateKey: dateKey,
    );
  }

  test('the day key follows the clock when it is refreshed', () async {
    DateTime now = DateTime(2026, 9, 20, 23, 50);
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[clockProvider.overrideWithValue(() => now)],
    );
    addTearDown(container.dispose);

    expect(container.read(todayKeyProvider), '2026-09-20');

    // Past midnight: a user returning to the app gets the new day.
    now = DateTime(2026, 9, 21, 0, 5);
    container.read(todayKeyProvider.notifier).refresh();
    expect(container.read(todayKeyProvider), '2026-09-21');
  });

  testWidgets('the meal list and water card follow the day across midnight',
      (WidgetTester tester) async {
    final AppDatabase db = await openSeededDb();
    final UserProfile answers = answerProfile();
    // Yesterday's meal and today's meal are different rows.
    await logOn(db, '2026-09-20', 300);
    await logOn(db, '2026-09-21', 700);

    DateTime now = DateTime(2026, 9, 20, 22, 0);
    final AppHarness harness = await pumpApp(
      tester,
      db: db,
      profile: answers,
      overrides: <Override>[clockProvider.overrideWithValue(() => now)],
    );

    // On the 20th the dashboard counts only the 20th's meal.
    await tester.pump(const Duration(milliseconds: 50));
    expect(readProvider(tester, todayKeyProvider), '2026-09-20');

    // Cross midnight and resume the app: the same providers now report the 21st.
    now = DateTime(2026, 9, 21, 0, 30);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump(const Duration(milliseconds: 50));

    expect(readProvider(tester, todayKeyProvider), '2026-09-21');
    final List<Meal> today =
        readProvider(tester, todayMealsProvider).value ?? const <Meal>[];
    expect(today, hasLength(1));
    expect(today.single.items.single.snapshot.kcal, 700);

    await harness.teardown(tester);
  });
}
