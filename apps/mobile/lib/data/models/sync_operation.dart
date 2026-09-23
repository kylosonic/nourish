import 'dart:convert';

import 'package:nourish_domain/domain.dart';

/// The device's offline queue vocabulary — the server's own (OFF-02).
///
/// The kinds and operations are a closed set because `POST /v1/sync` validates
/// them; a value outside this list would be rejected per-operation by the
/// server, which is a worse outcome than never queueing it.
enum SyncKind { meal, water, weight }

enum SyncOp { upsert, delete }

/// One queued operation, in the shape the wire expects.
///
/// Built once, at the moment the change happens, and stored as JSON: what is
/// pushed later is exactly what was queued, so a push can never describe a
/// change the device did not make.
class SyncOperation {
  const SyncOperation({
    required this.clientId,
    required this.kind,
    required this.op,
    required this.updatedAt,
    this.loggedAt,
    this.dateKey,
    this.slot,
    this.items = const <SyncOperationItem>[],
    this.amountMl,
    this.weightKg,
  });

  final String clientId;
  final SyncKind kind;
  final SyncOp op;

  /// When the device made the change. The server's merge rule is
  /// last-write-wins on this clock.
  final DateTime updatedAt;

  final DateTime? loggedAt;
  final String? dateKey;

  /// Meal only.
  final MealSlot? slot;
  final List<SyncOperationItem> items;

  /// Water only: signed millilitres (a removal is a negative amount).
  final int? amountMl;

  /// Weight only.
  final double? weightKg;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'kind': kind.name,
    'op': op.name,
    'clientId': clientId,
    'updatedAt': updatedAt.toUtc().toIso8601String(),
    if (loggedAt != null) 'loggedAt': loggedAt!.toUtc().toIso8601String(),
    if (dateKey != null) 'dateKey': dateKey,
    if (slot != null) 'slot': slot!.name,
    if (items.isNotEmpty)
      'items': items.map((SyncOperationItem i) => i.toJson()).toList(),
    if (amountMl != null) 'amountMl': amountMl,
    if (weightKg != null) 'weightKg': weightKg,
  };

  String encode() => jsonEncode(toJson());

  /// The same operation with its install-scoped id filled in. The queue builds
  /// the id, so the caller cannot get the scheme wrong.
  SyncOperation withClientId(String id) => SyncOperation(
    clientId: id,
    kind: kind,
    op: op,
    updatedAt: updatedAt,
    loggedAt: loggedAt,
    dateKey: dateKey,
    slot: slot,
    items: items,
    amountMl: amountMl,
    weightKg: weightKg,
  );

  static SyncOperation decode(String payload) {
    final Map<String, dynamic> json =
        jsonDecode(payload) as Map<String, dynamic>;
    return SyncOperation(
      clientId: json['clientId'] as String,
      kind: SyncKind.values.byName(json['kind'] as String),
      op: SyncOp.values.byName(json['op'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      loggedAt: json['loggedAt'] == null
          ? null
          : DateTime.parse(json['loggedAt'] as String),
      dateKey: json['dateKey'] as String?,
      slot: json['slot'] == null
          ? null
          : MealSlot.values.byName(json['slot'] as String),
      items: json['items'] == null
          ? const <SyncOperationItem>[]
          : (json['items'] as List<dynamic>)
                .map(
                  (dynamic item) => SyncOperationItem.fromJson(
                    item as Map<String, dynamic>,
                  ),
                )
                .toList(),
      amountMl: (json['amountMl'] as num?)?.toInt(),
      weightKg: (json['weightKg'] as num?)?.toDouble(),
    );
  }
}

/// One meal item on the wire: the frozen snapshot the app already stores, which
/// is what the server keeps so a meal keeps its numbers when the catalog moves.
///
/// The item carries its own [clientId] — the server validates one per item, and
/// it is what makes an item identifiable inside a meal across pushes.
class SyncOperationItem {
  const SyncOperationItem({
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

  Map<String, dynamic> toJson() => <String, dynamic>{
    'clientId': clientId,
    'foodId': foodId,
    'foodName': foodName,
    'portionUnit': portionUnit,
    'portionQuantity': portionQuantity,
    'grams': grams,
    'kcal': kcal,
    'proteinG': proteinG,
    'carbsG': carbsG,
    'fatG': fatG,
    if (fiberG != null) 'fiberG': fiberG,
    if (sodiumMg != null) 'sodiumMg': sodiumMg,
  };

  /// The same item with its install-scoped id filled in.
  SyncOperationItem withClientId(String id) => SyncOperationItem(
    clientId: id,
    foodId: foodId,
    foodName: foodName,
    portionUnit: portionUnit,
    portionQuantity: portionQuantity,
    grams: grams,
    kcal: kcal,
    proteinG: proteinG,
    carbsG: carbsG,
    fatG: fatG,
    fiberG: fiberG,
    sodiumMg: sodiumMg,
  );

  factory SyncOperationItem.fromJson(Map<String, dynamic> json) =>
      SyncOperationItem(
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

/// What the server said about one operation, in the order it was sent.
///
/// A refused operation is reported, not swallowed: the queue keeps it and the
/// account screen says what went wrong.
class SyncPushOutcome {
  const SyncPushOutcome({
    required this.clientId,
    required this.kind,
    required this.outcome,
    this.message,
  });

  final String clientId;
  final String kind;

  /// `applied` | `ignored-stale` | `unchanged` | `rejected`.
  final String outcome;

  /// The server's reason, for a rejection.
  final String? message;

  /// True when the server has taken this operation and the device can forget it.
  /// `ignored-stale` and `unchanged` both mean the server already holds
  /// something at least as new — retrying would be pointless, not a failure.
  bool get isDone =>
      outcome == 'applied' || outcome == 'ignored-stale' || outcome == 'unchanged';

  bool get isRejected => outcome == 'rejected';
}

/// The result of one push.
class SyncPushResult {
  const SyncPushResult({
    required this.outcomes,
    required this.serverTime,
  });

  final List<SyncPushOutcome> outcomes;

  /// The server's clock at the time of the push (the pull cursor's origin).
  final DateTime? serverTime;

  int get applied =>
      outcomes.where((SyncPushOutcome o) => o.outcome == 'applied').length;

  int get rejected =>
      outcomes.where((SyncPushOutcome o) => o.isRejected).length;
}
