import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';

import '../sources/catalog_data_source.dart';
import 'catalog_sync_state.dart';

/// Catalog sync (OFF-01, blueprint S1 §11): version-gated, a single
/// transactional replace on success, keep-the-previous-catalog on ANY
/// failure. Bootstrap fires [sync] once, fire-and-forget, after the seed
/// import (master §62 — Home must never block on the network).
class CatalogSyncService {
  CatalogSyncService({
    required CatalogDataSource local,
    required CatalogDataSource api,
  }) : this._(local, api);

  CatalogSyncService._(this._local, this._api);

  final CatalogDataSource _local;
  final CatalogDataSource _api;

  /// Live sync lifecycle: idle → syncing → synced(version) | failed.
  /// The provider graph mirrors this into `catalogSyncStateProvider`.
  final ValueNotifier<CatalogSyncState> state =
      ValueNotifier<CatalogSyncState>(const CatalogSyncIdle());

  /// Runs the version-gated sync. Never throws: failures are logged
  /// under the `catalog-sync` category and leave the local catalog
  /// untouched.
  Future<void> sync() async {
    state.value = const CatalogSyncSyncing();
    try {
      final String? stored = await _local.storedVersion();
      final CatalogSnapshot? snapshot = await _api.fetchSnapshot(etag: stored);
      if (snapshot == null) {
        // 304 / not modified: the stored catalog is already current.
        if (stored == null) {
          developer.log(
            'catalog fetch reported not-modified without a stored '
            'version — treated as failure',
            name: 'catalog-sync',
          );
          state.value = const CatalogSyncFailed();
        } else {
          state.value = CatalogSyncSynced(stored);
        }
        return;
      }
      if (snapshot.version == stored) {
        // The server ignored the conditional GET: same version,
        // nothing to replace.
        state.value = CatalogSyncSynced(snapshot.version);
        return;
      }
      await _local.replaceAll(snapshot);
      developer.log(
        'catalog replaced with ${snapshot.version} '
        '(${snapshot.foods.length} foods, source '
        '${snapshot.sourceName})',
        name: 'catalog-sync',
      );
      state.value = CatalogSyncSynced(snapshot.version);
    } catch (error, stackTrace) {
      developer.log(
        'catalog sync failed — keeping the previous catalog',
        name: 'catalog-sync',
        error: error,
        stackTrace: stackTrace,
      );
      String? previous;
      try {
        previous = await _local.storedVersion();
      } catch (_) {
        // Best-effort; the failure state itself is the signal.
      }
      state.value = CatalogSyncFailed(previousVersion: previous);
    }
  }
}
