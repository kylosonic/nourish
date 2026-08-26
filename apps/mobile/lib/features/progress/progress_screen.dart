import 'package:flutter/material.dart';

import '../../l10n/strings.dart';
import '../common/coming_soon_screen.dart';

/// ADR-0005 honest empty state (P-HOME-3): a real screen with honest
/// "coming soon" copy — no fake data, no dead ends.
class ProgressScreen extends StatelessWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ComingSoonScreen(
      title: Strings.progressComingTitle,
      body: Strings.progressComingBody,
      icon: Icons.show_chart,
    );
  }
}
