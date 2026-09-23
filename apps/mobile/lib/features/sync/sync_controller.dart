import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/account_session.dart';
import '../../data/models/sync_operation.dart';
import '../../data/repositories/sync_queue_repository.dart';
import '../../data/sources/auth_api_client.dart';
import '../../data/sources/sync_api_client.dart';
import '../../providers.dart';

/// What the last sync attempt did.
enum SyncStage { idle, syncing, synced, failed, signedOut }

class SyncState {
  const SyncState({
    this.stage = SyncStage.idle,
    this.applied = 0,
    this.rejected = 0,
    this.message,
    this.lastSyncedAt,
  });

  final SyncStage stage;

  /// Operations the server took in the last push.
  final int applied;

  /// Operations the server refused (they stay queued and visible).
  final int rejected;

  /// The sentence to show for the last failure.
  final String? message;

  final DateTime? lastSyncedAt;
}

/// Pushes the device's queued changes to the server (OFF-02).
///
/// Push only, deliberately: the app's own tables are the working copy, and
/// applying remote rows into them is the half that can corrupt a user's own
/// records. Until that half exists and is tested, this engine sends and never
/// overwrites anything locally.
///
/// A stored session is enough to try: the push itself is the check, and a
/// refusal for an expired token is answered by rotating once and retrying the
/// same batch. With no session at all the queue simply waits, so a meal logged
/// before signing in still reaches the server afterwards.
class SyncController extends Notifier<SyncState> {
  @override
  SyncState build() => const SyncState();

  SyncApi get _api => ref.read(syncApiProvider);

  SyncQueueRepository get _queue => ref.read(syncQueueRepositoryProvider);

  /// Push everything queued for the signed-in account.
  ///
  /// Returns the number of operations the server took. A failure is reported in
  /// the state and never thrown at the caller: sync is a background
  /// convenience, and losing a meal log because a push failed would be a
  /// catastrophic trade.
  Future<int> syncNow() async {
    final SessionTokens? stored = await ref.read(tokenStoreProvider).read();
    if (stored == null) {
      state = const SyncState(stage: SyncStage.signedOut);
      return 0;
    }

    final List<QueuedOperation> firstBatch = await _queue.pending(limit: 200);
    if (firstBatch.isEmpty) {
      // Nothing to send: do not wake the radio to say so.
      state = SyncState(
        stage: SyncStage.synced,
        applied: 0,
        lastSyncedAt: DateTime.now(),
      );
      return 0;
    }

    state = const SyncState(stage: SyncStage.syncing);
    int appliedTotal = 0;
    int rejectedTotal = 0;
    String accessToken = stored.accessToken;
    bool rotated = false;

    try {
      // Drain in batches until the queue is empty or a batch completes nothing,
      // so a long offline stretch does not need the user to press twice.
      for (int batch = 0; batch < 10; batch++) {
        final List<QueuedOperation> pending = batch == 0
            ? firstBatch
            : await _queue.pending(limit: 200);
        if (pending.isEmpty) break;

        SyncPushResult result;
        try {
          result = await _api.push(
            accessToken: accessToken,
            operations: pending
                .map((QueuedOperation op) => op.operation)
                .toList(),
          );
        } on AuthException catch (error) {
          final bool expired =
              error.code == 'TOKEN_EXPIRED' ||
              error.code == 'UNAUTHENTICATED' ||
              error.code == 'HTTP_401';
          if (!expired || rotated) rethrow;
          // Rotate once, then retry the same batch with the new token.
          final SessionTokens fresh = await ref
              .read(authApiProvider)
              .refresh(stored.refreshToken);
          await ref.read(tokenStoreProvider).write(fresh);
          accessToken = fresh.accessToken;
          rotated = true;
          continue;
        }

        // The server answers one outcome per operation, in order. Anything it
        // did not answer for stays queued rather than being assumed applied.
        final Map<String, SyncPushOutcome> byClientId =
            <String, SyncPushOutcome>{
              for (final SyncPushOutcome outcome in result.outcomes)
                outcome.clientId: outcome,
            };

        final List<int> done = <int>[];
        for (final QueuedOperation op in pending) {
          final SyncPushOutcome? outcome = byClientId[op.clientId];
          if (outcome == null) continue;
          if (outcome.isDone) {
            done.add(op.id);
            if (outcome.outcome == 'applied') appliedTotal++;
          } else if (outcome.isRejected) {
            rejectedTotal++;
            await _queue.recordFailure(
              op.id,
              outcome.message ?? 'The server refused this change.',
            );
            // A rejected operation is kept: dropping it would hide a change the
            // device made, and retrying it inside this same run would just
            // record the same refusal again, so the loop stops making progress
            // here and the operation stays visible with its reason.
          }
        }
        await _queue.markDone(done);
        if (done.isEmpty) break;
      }

      state = SyncState(
        stage: rejectedTotal > 0 ? SyncStage.failed : SyncStage.synced,
        applied: appliedTotal,
        rejected: rejectedTotal,
        message: rejectedTotal > 0
            ? 'The server refused $rejectedTotal change'
                  '${rejectedTotal == 1 ? '' : 's'}. They are still queued.'
            : null,
        lastSyncedAt: DateTime.now(),
      );
      return appliedTotal;
    } on AuthException catch (error) {
      state = SyncState(
        stage: SyncStage.failed,
        applied: appliedTotal,
        message: error.message,
      );
      return appliedTotal;
    }
  }
}

final NotifierProvider<SyncController, SyncState> syncControllerProvider =
    NotifierProvider<SyncController, SyncState>(SyncController.new);

/// How many local changes are waiting to reach the server (the queue is the
/// source of truth, not a counter the UI keeps).
final StreamProvider<int> pendingSyncCountProvider = StreamProvider<int>(
  (Ref<AsyncValue<int>> ref) =>
      ref.watch(syncQueueRepositoryProvider).watchPendingCount(),
);
