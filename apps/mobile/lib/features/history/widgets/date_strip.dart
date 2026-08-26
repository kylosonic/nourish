import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../../providers.dart';

/// 7-day date strip (LOG-06): today-3 .. today+3, selected date
/// highlighted, future dates allowed but empty. Selecting a date
/// re-renders summary + meals for that day.
class DateStrip extends ConsumerWidget {
  const DateStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final DateTime selected = ref.watch(selectedHistoryDateProvider);
    final SelectedHistoryDate controller = ref.read(
      selectedHistoryDateProvider.notifier,
    );
    final DateTime today = DateTime.now();
    final DateTime start = today.subtract(const Duration(days: 3));

    return SizedBox(
      height: 80,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 7,
        separatorBuilder: (BuildContext context, int index) =>
            const SizedBox(width: 8),
        itemBuilder: (BuildContext context, int index) {
          final DateTime date = start.add(Duration(days: index));
          final bool isSelected = _sameDay(date, selected);
          final bool isToday = _sameDay(date, today);

          return _DayTile(
            date: date,
            selected: isSelected,
            today: isToday,
            onTap: () => controller.set(date),
          );
        },
      ),
    );
  }

  static bool _sameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

class _DayTile extends StatelessWidget {
  const _DayTile({
    required this.date,
    required this.selected,
    required this.today,
    required this.onTap,
  });

  final DateTime date;
  final bool selected;
  final bool today;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final String weekday = DateFormat('EEE').format(date).toUpperCase();

    final Color background = selected
        ? NourishColors.primaryContainer
        : today
        ? NourishColors.surfaceContainerLowest
        : NourishColors.surfaceContainerHighest;
    final Color foreground = selected
        ? NourishColors.onPrimaryContainer
        : today
        ? NourishColors.onSurface
        : NourishColors.onSurfaceVariant;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(NourishRadii.input),
        child: Container(
          width: 64,
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(NourishRadii.input),
            border: today && !selected
                ? Border.all(color: NourishColors.primary)
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Text(
                weekday,
                style: NourishTextStyles.labelCaps.copyWith(
                  color: foreground.withValues(alpha: selected || today ? 1 : 0.7),
                  fontSize: 10,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${date.day}',
                style: NourishTextStyles.headlineMd.copyWith(
                  color: foreground,
                  fontSize: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
