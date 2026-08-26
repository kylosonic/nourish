import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../core/date_utils.dart';
import '../../l10n/strings.dart';
import '../../router/routes.dart';
import 'widgets/calorie_ring.dart';
import 'widgets/hydration_card.dart';
import 'widgets/macro_pills.dart';
import 'widgets/todays_meals_card.dart';

/// HOME-01 dashboard: time-based greeting, Nourish mark, avatar
/// placeholder and notifications icon (honest void); then the calorie
/// ring, macro pills, today's meals and hydration.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String greeting = Strings.greetingFor(
      greetingBucketFor(DateTime.now()),
    );

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              NourishSpacing.containerMargin,
              NourishSpacing.base,
              NourishSpacing.containerMargin,
              0,
            ),
            child: Row(
              children: <Widget>[
                // Avatar placeholder (local; no remote imagery).
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: NourishColors.surfaceContainerHigh,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.person,
                    size: 22,
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        greeting.toUpperCase(),
                        style: NourishTextStyles.labelCaps.copyWith(
                          color: NourishColors.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        Strings.appName,
                        style: NourishTextStyles.headlineMd.copyWith(
                          color: NourishColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: Strings.notificationsTitle,
                  onPressed: () => context.go(
                    AppRoutes.honestVoidFor('notifications'),
                  ),
                  icon: const Icon(
                    Icons.notifications_none,
                    color: NourishColors.primary,
                  ),
                ),
              ],
            ),
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
                  const CalorieRingCard(),
                  const SizedBox(height: NourishSpacing.gutter),
                  const MacroPills(),
                  const SizedBox(height: NourishSpacing.sectionGap),
                  const TodaysMealsCard(),
                  const SizedBox(height: NourishSpacing.gutter),
                  const HydrationCard(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
