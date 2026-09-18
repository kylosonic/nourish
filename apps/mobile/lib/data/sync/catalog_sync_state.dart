/// Sync lifecycle states (blueprint S1 §12). The search footer switches
/// from the provisional bootstrap disclaimer to the FCT citation once a
/// snapshot has been synced.
sealed class CatalogSyncState {
  const CatalogSyncState();
}

/// No snapshot has ever been synced: the bootstrap seed catalog is in
/// place.
final class CatalogSyncIdle extends CatalogSyncState {
  const CatalogSyncIdle();
}

/// A sync attempt is in flight.
final class CatalogSyncSyncing extends CatalogSyncState {
  const CatalogSyncSyncing();
}

/// The catalog was replaced with the snapshot at [version].
final class CatalogSyncSynced extends CatalogSyncState {
  const CatalogSyncSynced(this.version);

  final String version;

  @override
  bool operator ==(Object other) =>
      other is CatalogSyncSynced && other.version == version;

  @override
  int get hashCode => version.hashCode;
}

/// The last sync attempt failed; the previous catalog stays in place
/// (OFF-01). [previousVersion] is non-null when an earlier sync succeeded
/// — the catalog is still FCT data, just not refreshed.
final class CatalogSyncFailed extends CatalogSyncState {
  const CatalogSyncFailed({this.previousVersion});

  /// The version of the last successful sync, if any.
  final String? previousVersion;

  @override
  bool operator ==(Object other) =>
      other is CatalogSyncFailed && other.previousVersion == previousVersion;

  @override
  int get hashCode => previousVersion.hashCode;
}
