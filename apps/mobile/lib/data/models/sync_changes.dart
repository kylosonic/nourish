/// What `GET /v1/sync/changes` returns (OFF-02), as the device sees it.
///
/// The rows the server holds, each carrying the `clientId` the device minted for
/// it. That id is the only thing that can match a remote row to a local one, so
/// it is kept verbatim here rather than re-derived.
///
/// A row with [deletedAt] set is a **tombstone**: the record was removed, and
/// the absence of a row would mean "not seen yet" instead. The apply step must
/// not confuse the two.
library;

/// One remote row, whichever table it belongs to.
class RemoteChange {
  const RemoteChange({
    required this.clientId,
    required this.dateKey,
    required this.updatedAt,
    this.loggedAt,
    this.deletedAt,
    this.slot,
    this.items = const <RemoteChangeItem>[],
    this.amountMl,
    this.weightKg,
  });

  final String clientId;
  final String dateKey;
  final DateTime updatedAt;
  final DateTime? loggedAt;

  /// Set when the row was removed on another device.
  final DateTime? deletedAt;

  final String? slot;
  final List<RemoteChangeItem> items;

  /// Water rows only: signed millilitres.
  final int? amountMl;

  /// Weight rows only.
  final double? weightKg;

  bool get isDeleted => deletedAt != null;

  factory RemoteChange.fromJson(Map<String, dynamic> json) => RemoteChange(
    clientId: json['clientId'] as String,
    dateKey: (json['dateKey'] as String?) ?? '',
    updatedAt: DateTime.parse(json['updatedAt'] as String),
    loggedAt: json['loggedAt'] == null
        ? null
        : DateTime.parse(json['loggedAt'] as String),
    deletedAt: json['deletedAt'] == null
        ? null
        : DateTime.parse(json['deletedAt'] as String),
    slot: json['slot'] as String?,
    items: json['items'] == null
        ? const <RemoteChangeItem>[]
        : (json['items'] as List<dynamic>)
              .map(
                (dynamic item) =>
                    RemoteChangeItem.fromJson(item as Map<String, dynamic>),
              )
              .toList(),
    amountMl: (json['amountMl'] as num?)?.toInt(),
    weightKg: (json['weightKg'] as num?)?.toDouble(),
  );
}

/// One item of a remote meal, with the snapshot the server stored.
class RemoteChangeItem {
  const RemoteChangeItem({
    required this.clientId,
    required this.foodId,
    required this.foodName,
    required this.portionUnit,
    required this.portionQuantity,
    required this.grams,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.fiberG,
    this.sodiumMg,
  });

  final String clientId;
  final String foodId;
  final String foodName;
  final String portionUnit;
  final double portionQuantity;
  final double grams;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final double? sodiumMg;

  factory RemoteChangeItem.fromJson(Map<String, dynamic> json) =>
      RemoteChangeItem(
        clientId: (json['clientId'] as String?) ?? '',
        foodId: json['foodId'] as String,
        foodName: json['foodName'] as String,
        portionUnit: json['portionUnit'] as String,
        portionQuantity: (json['portionQuantity'] as num).toDouble(),
        grams: (json['grams'] as num).toDouble(),
        kcal: (json['kcal'] as num).toDouble(),
        proteinG: (json['proteinG'] as num).toDouble(),
        carbsG: (json['carbsG'] as num).toDouble(),
        fatG: (json['fatG'] as num).toDouble(),
        fiberG: (json['fiberG'] as num?)?.toDouble(),
        sodiumMg: (json['sodiumMg'] as num?)?.toDouble(),
      );
}

/// Everything the server returned for one pull.
class SyncChanges {
  const SyncChanges({
    required this.meals,
    required this.water,
    required this.weight,
    this.serverTime,
  });

  final List<RemoteChange> meals;
  final List<RemoteChange> water;
  final List<RemoteChange> weight;

  /// The cursor to send back as `since` next time. Null when the server did not
  /// say — in which case the caller must not advance its cursor, or it would
  /// skip whatever arrived in between.
  final DateTime? serverTime;

  bool get isEmpty => meals.isEmpty && water.isEmpty && weight.isEmpty;

  int get length => meals.length + water.length + weight.length;

  factory SyncChanges.fromJson(Map<String, dynamic> json) => SyncChanges(
    meals: _rows(json['meals']),
    water: _rows(json['water']),
    weight: _rows(json['weight']),
    serverTime: json['serverTime'] == null
        ? null
        : DateTime.tryParse(json['serverTime'] as String),
  );

  static List<RemoteChange> _rows(Object? raw) => raw == null
      ? const <RemoteChange>[]
      : (raw as List<dynamic>)
            .map(
              (dynamic row) =>
                  RemoteChange.fromJson(row as Map<String, dynamic>),
            )
            .toList();
}
