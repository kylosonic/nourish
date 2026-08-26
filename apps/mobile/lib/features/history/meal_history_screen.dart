import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../l10n/strings.dart';
import '../../providers.dart';
import '../../router/routes.dart';
import '../scan/scan_menu_sheet.dart';
import 'widgets/daily_summary_cards.dart';
import 'widgets/date_strip.dart';
import 'widgets/meal_entry_tile.dart';

/// LOG-06 meal history: 7-day date strip, Daily Summary cards and the
/// selected day's meals (immutable snapshots). LOG MEAL opens the scan
/// menu. The calendar control routes to its honest void (full date
/// picker deferred, P-LOG-5).
class MealHistoryScreen extends ConsumerWidget {
  const MealHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Meal>> meals = ref.watch(historyMealsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          Strings.historyTitle,
          style: TextStyle(color: NourishColors.primary),
        ),
        leading: IconButton(
          tooltip: Strings.backTooltip,
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: <Widget>[
          IconButton(
            tooltip: Strings.calendarTooltip,
            icon: const Icon(Icons.calendar_today_outlined),
            onPressed: () => context.go(AppRoutes.honestVoidFor('calendar')),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const Padding(
              padding: EdgeInsets.symmetric(
                horizontal: NourishSpacing.containerMargin,
              ),
              child: DateStrip(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                  NourishSpacing.containerMargin,
                  NourishSpacing.gutter,
                  NourishSpacing.containerMargin,
                  NourishSpacing.containerMargin,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    const DailySummaryCards(),
                    const SizedBox(height: NourishSpacing.sectionGap),
                    Text(
                      Strings.todayMeals,
                      style: NourishTextStyles.labelCaps.copyWith(
                        color: NourishColors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: NourishSpacing.gutter),
                    meals.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.all(32),
                        child: Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            color: NourishColors.primary,
                          ),
                        ),
                      ),
                      error: (Object error, StackTrace stack) => Text(
                        Strings.noMealsForDay,
                        textAlign: TextAlign.center,
                        style: NourishTextStyles.bodyMd.copyWith(
                          color: NourishColors.onSurfaceVariant,
                        ),
                      ),
                      data: (List<Meal> value) => value.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.symmetric(vertical: 32),
                              child: Text(
                                Strings.noMealsForDay,
                                textAlign: TextAlign.center,
                                style: NourishTextStyles.bodyMd.copyWith(
                                  color: NourishColors.onSurfaceVariant,
                                ),
                              ),
                            )
                          : Column(
                              children: <Widget>[
                                for (final Meal meal in value) ...<Widget>[
                                  MealEntryTile(meal: meal),
                                  const SizedBox(
                                    height: NourishSpacing.gutter,
                                  ),
                                ],
                              ],
                            ),
                    ),
                    const SizedBox(height: NourishSpacing.gutter),
                    NourishButton(
                      label: Strings.logMeal,
                      icon: Icons.add,
                      onPressed: () => showScanMenuSheet(context),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
