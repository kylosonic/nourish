import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_domain/domain.dart';

import '../../providers.dart';
import 'weight_trend.dart';

/// The trend window the user is looking at (WW-03: weekly / monthly views).
enum WeightWindow {
  week(days: 7, label: 'WEEK'),
  month(days: 30, label: 'MONTH');

  const WeightWindow({required this.days, required this.label});

  final int days;
  final String label;
}

class SelectedWeightWindow extends Notifier<WeightWindow> {
  @override
  WeightWindow build() => WeightWindow.week;

  void select(WeightWindow window) => state = window;
}

final NotifierProvider<SelectedWeightWindow, WeightWindow>
    selectedWeightWindowProvider =
    NotifierProvider<SelectedWeightWindow, WeightWindow>(
      SelectedWeightWindow.new,
    );

/// Weight entries, newest first by measured day (the history list).
final StreamProvider<List<WeightEntry>> weightHistoryProvider =
    StreamProvider<List<WeightEntry>>(
      (ref) => ref.watch(weightRepositoryProvider).watchHistory(),
    );

/// The trend for the selected window, against the profile's target weight.
///
/// This waits on [weightHistoryProvider] before reading the window, so the
/// trend is derived from the table rather than frozen at its first read: the
/// Home card and this screen both watch it, and an entry written anywhere must
/// move both. The window query itself stays in the repository (a ranged,
/// indexed read) instead of filtering a full history in Dart.
final FutureProvider<WeightTrend> weightTrendProvider =
    FutureProvider<WeightTrend>((ref) async {
      final WeightWindow window = ref.watch(selectedWeightWindowProvider);
      final UserProfile? profile = await ref.watch(currentUserProvider.future);
      await ref.watch(weightHistoryProvider.future);
      return ref
          .watch(weightRepositoryProvider)
          .trend(
            days: window.days,
            targetKg: profile?.targetWeightKg,
            at: ref.watch(clockProvider)(),
          );
    });
