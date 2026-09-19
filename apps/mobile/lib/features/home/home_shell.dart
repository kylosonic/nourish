import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import '../../providers.dart';
import '../insights/insights_providers.dart';
import '../insights/insights_screen.dart';
import '../profile/profile_screen.dart';
import '../progress/progress_screen.dart';
import '../scan/scan_menu_sheet.dart';
import 'home_screen.dart';

/// HOME-05 shell: custom bottom navigation with 5 slots
/// (Home / Progress / Scan-center FAB / Insights / Profile). The scan
/// center opens the six-option scan menu as a modal bottom sheet over
/// Home — NOT a route (overlay rule).
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  static const List<Widget> _pages = <Widget>[
    HomeScreen(),
    ProgressScreen(),
    InsightsScreen(),
    ProfileScreen(),
  ];

  /// Maps a nav slot to its page index (scan slot has no page).
  static const List<int> _pageForSlot = <int>[0, 1, 2, 3];

  void _selectTab(int slot) {
    final int page = _pageForSlot[slot];
    // Insights is a report over the trailing week, and the IndexedStack keeps
    // every page mounted, so the provider would otherwise keep whatever it
    // computed when the app first built the tree. Recompute it when the user
    // actually opens the tab.
    if (page == 2) {
      ref.invalidate(weeklyInsightsProvider);
    }
    setState(() => _index = page);
  }

  void _openScan() {
    // Opened from the scan center (no slot pre-scope): clear any stale
    // meal context so a later quick-add asks for a slot honestly.
    ref.read(activeMealContextProvider.notifier).clear();
    showScanMenuSheet(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: _NourishBottomBar(
        selectedIndex: _index,
        onTabSelected: _selectTab,
        onScanPressed: _openScan,
      ),
    );
  }
}

class _NourishBottomBar extends StatelessWidget {
  const _NourishBottomBar({
    required this.selectedIndex,
    required this.onTabSelected,
    required this.onScanPressed,
  });

  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onScanPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: NourishColors.surface.withValues(alpha: 0.9),
        boxShadow: NourishElevation.level1,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            NourishSpacing.gutter,
            8,
            NourishSpacing.gutter,
            8,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Expanded(
                child: _NavItem(
                  icon: Icons.home,
                  label: Strings.homeTab,
                  selected: selectedIndex == 0,
                  onTap: () => onTabSelected(0),
                ),
              ),
              Expanded(
                child: _NavItem(
                  icon: Icons.query_stats,
                  label: Strings.progressTab,
                  selected: selectedIndex == 1,
                  onTap: () => onTabSelected(1),
                ),
              ),
              // Raised center scan action (HOME-05).
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Material(
                      color: NourishColors.primary,
                      shape: const CircleBorder(),
                      elevation: 2,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: onScanPressed,
                        child: const SizedBox(
                          width: 52,
                          height: 52,
                          child: Icon(
                            Icons.add_circle,
                            size: 32,
                            color: NourishColors.onPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Strings.scanTab,
                      style: NourishTextStyles.labelCaps.copyWith(
                        color: NourishColors.primary,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _NavItem(
                  icon: Icons.lightbulb_outline,
                  label: Strings.insightsTab,
                  selected: selectedIndex == 2,
                  onTap: () => onTabSelected(2),
                ),
              ),
              Expanded(
                child: _NavItem(
                  icon: Icons.person_outline,
                  label: Strings.profileTab,
                  selected: selectedIndex == 3,
                  onTap: () => onTabSelected(3),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final Color color = selected
        ? NourishColors.primary
        : NourishColors.onSurfaceVariant;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(NourishRadii.input),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: selected
              ? NourishColors.primaryContainer.withValues(alpha: 0.10)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(NourishRadii.input),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 2),
            Text(
              label,
              style: NourishTextStyles.labelCaps.copyWith(
                color: color,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
