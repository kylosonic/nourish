import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../data/models/account_session.dart';
import '../../l10n/strings.dart';
import '../../router/routes.dart';
import '../auth/auth_controller.dart';
import '../sync/sync_controller.dart';

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
                  else if (auth.isUnconfirmed)
                    const _Unconfirmed()
                  else
                    const _SignedOut(),
                  const SizedBox(height: NourishSpacing.gutter),
                  // Rendered signed out too: the count of waiting changes is
                  // the user's own data, and it is the reason to sign in.
                  const _BackupPanel(),
                  if (auth.isSignedIn || auth.isUnconfirmed) ...<Widget>[
                    const SizedBox(height: NourishSpacing.gutter),
                    NourishButton(
                      variant: NourishButtonVariant.secondary,
                      label: Strings.accountSignOutAction,
                      // Captured before the await: the button's own context is
                      // gone by the time the server answers.
                      onPressed: () async {
                        final ScaffoldMessengerState messenger =
                            ScaffoldMessenger.of(context);
                        final bool endedOnServer = await ref
                            .read(authControllerProvider.notifier)
                            .signOut();
                        if (endedOnServer) return;
                        // The device is signed out either way; only the server
                        // session outlived it, and saying so is better than
                        // implying otherwise.
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text(Strings.accountSignOutFailed),
                          ),
                        );
                      },
                    ),
                  ],
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
      ],
    );
  }
}

/// A stored session the server could not confirm (offline, or a transient
/// failure). Showing the signed-out state here would tell the user they have no
/// account when they do.
class _Unconfirmed extends StatelessWidget {
  const _Unconfirmed();

  @override
  Widget build(BuildContext context) {
    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.accountUnconfirmedTitle,
            style: NourishTextStyles.headlineMd,
          ),
          const SizedBox(height: 8),
          Text(
            Strings.accountUnconfirmedBody,
            style: NourishTextStyles.bodyMd.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// The backup panel (OFF-02).
///
/// Push only, and it says so: changes reach the account, but restoring them on
/// a new device is not built. The pending count comes from the queue itself, so
/// the number on screen is the number of changes actually waiting rather than
/// an optimistic guess.
class _BackupPanel extends ConsumerWidget {
  const _BackupPanel();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int pending = ref.watch(pendingSyncCountProvider).value ?? 0;
    final SyncState sync = ref.watch(syncControllerProvider);
    // Whether there is an account at all is the auth state's business, not the
    // sync engine's: a user who has never signed in should be told to, even
    // though no push has been attempted.
    final AuthState auth = ref.watch(authControllerProvider);
    final bool hasSession = auth.isSignedIn || auth.sessionStored;

    final String status = !hasSession
        ? (pending == 0
              ? Strings.syncSignedOutBody
              : Strings.syncPendingSignedOut(pending))
        : switch (sync.stage) {
            SyncStage.syncing => Strings.syncInProgress,
            SyncStage.synced => sync.applied > 0
                ? Strings.syncDone(sync.applied)
                : Strings.syncUpToDate,
            SyncStage.failed => sync.message ?? Strings.syncNeverRun,
            SyncStage.signedOut => pending == 0
                ? Strings.syncSignedOutBody
                : Strings.syncPendingSignedOut(pending),
            SyncStage.idle => pending == 0
                ? (sync.lastSyncedAt == null
                      ? Strings.syncNeverRun
                      : Strings.syncPendingNone)
                : Strings.syncPendingCount(pending),
          };

    return NourishCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text(Strings.syncTitle, style: NourishTextStyles.headlineMd),
          const SizedBox(height: 8),
          Text(
            status,
            style: NourishTextStyles.bodyMd.copyWith(
              color: sync.stage == SyncStage.failed
                  ? NourishColors.error
                  : NourishColors.onSurfaceVariant,
            ),
          ),
          if (sync.rejected > 0) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              Strings.syncRetrying(sync.rejected),
              style: NourishTextStyles.bodyMd.copyWith(
                fontSize: 13,
                color: NourishColors.error,
              ),
            ),
          ],
          const SizedBox(height: 12),
          NourishButton(
            variant: NourishButtonVariant.secondary,
            label: Strings.syncNowAction,
            onPressed: sync.stage == SyncStage.syncing
                ? null
                : () => ref.read(syncControllerProvider.notifier).syncNow(),
          ),
          const SizedBox(height: 8),
          Text(
            Strings.syncPushOnlyNote,
            style: NourishTextStyles.bodyMd.copyWith(
              fontSize: 13,
              color: NourishColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
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
