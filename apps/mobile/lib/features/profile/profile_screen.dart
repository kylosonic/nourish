import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../data/models/account_session.dart';
import '../../l10n/strings.dart';
import '../../router/routes.dart';
import '../auth/auth_controller.dart';

/// The Profile tab, now the account surface (S3, AUTH-01..03).
///
/// Signed out, it explains that everything stays on the device and offers
/// sign-in. Signed in, it reports what the server holds — the normalized
/// number, the plan, the consent flag, the session count — and nothing it
/// cannot know. It deliberately states that backup/sync is not built yet rather
/// than implying a backup that does not exist.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AuthState auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          Strings.accountTitle,
          style: TextStyle(color: NourishColors.primary),
        ),
      ),
      body: SafeArea(
        child: auth.restoring
            ? const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: NourishColors.primary,
                ),
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(
                  NourishSpacing.containerMargin,
                  NourishSpacing.base,
                  NourishSpacing.containerMargin,
                  NourishSpacing.sectionGap,
                ),
                children: <Widget>[
                  if (auth.isSignedIn)
                    _SignedIn(account: auth.account!)
                  else
                    const _SignedOut(),
                ],
              ),
      ),
    );
  }
}

class _SignedOut extends StatelessWidget {
  const _SignedOut();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                Strings.accountSignedOutBody,
                style: NourishTextStyles.bodyMd.copyWith(
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: NourishSpacing.gutter),
              NourishButton(
                label: Strings.accountSignInAction,
                onPressed: () => context.push(AppRoutes.signIn),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SignedIn extends ConsumerWidget {
  const _SignedIn({required this.account});

  final Account account;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _Row(
                label: Strings.accountPhone,
                value: account.phoneE164,
              ),
              const SizedBox(height: 12),
              _Row(
                label: Strings.accountPlan,
                value: account.plan == AccountPlan.premium
                    ? Strings.accountPlanPremium
                    : Strings.accountPlanFree,
              ),
              const SizedBox(height: 12),
              _Row(
                label: Strings.accountSessions,
                value: '${account.activeSessions}',
              ),
              const SizedBox(height: 12),
              _Row(
                label: Strings.accountConsent,
                value: account.aiImprovementConsent
                    ? Strings.accountConsentOn
                    : Strings.accountConsentOff,
              ),
              const SizedBox(height: 12),
              Text(
                Strings.accountConsentNote,
                style: NourishTextStyles.bodyMd.copyWith(
                  fontSize: 13,
                  color: NourishColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        NourishCard(
          padding: const EdgeInsets.all(16),
          child: Text(
            Strings.accountSyncNote,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        NourishButton(
          variant: NourishButtonVariant.secondary,
          label: Strings.accountSignOutAction,
          onPressed: () async {
            final bool endedOnServer = await ref
                .read(authControllerProvider.notifier)
                .signOut();
            if (endedOnServer) return;
            // The device is signed out either way; only the server session
            // outlived it, and saying so is better than implying otherwise.
            messenger.showSnackBar(
              const SnackBar(content: Text(Strings.accountSignOutFailed)),
            );
          },
        ),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: Text(
            label.toUpperCase(),
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ),
        Text(value, style: NourishTextStyles.bodyLg),
      ],
    );
  }
}
