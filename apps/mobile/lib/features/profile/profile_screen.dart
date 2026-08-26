import 'package:flutter/material.dart';

import '../../l10n/strings.dart';
import '../common/coming_soon_screen.dart';

/// ADR-0005 honest empty state: real screen, honest "coming soon" copy,
/// no fake data.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ComingSoonScreen(
      title: Strings.profileComingTitle,
      body: Strings.profileComingBody,
      icon: Icons.person_outline,
    );
  }
}
