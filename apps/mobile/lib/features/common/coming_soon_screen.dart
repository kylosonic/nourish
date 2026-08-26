import 'package:flutter/material.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

/// Shared honest empty-state layout for deferred surfaces (ADR-0005 /
/// P-HOME-3): real screen, honest "coming soon" copy, no fake data.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({
    super.key,
    required this.title,
    required this.body,
    required this.icon,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(NourishSpacing.containerMargin),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: NourishColors.surfaceContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 32, color: NourishColors.outline),
                ),
                const SizedBox(height: 24),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: NourishTextStyles.headlineMd.copyWith(
                    color: NourishColors.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  body,
                  textAlign: TextAlign.center,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
