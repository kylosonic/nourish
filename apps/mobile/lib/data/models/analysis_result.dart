import 'dart:developer' as developer;

/// The mobile view of one `/v1/analyses` result (S2 §5).
///
/// The mapper is deliberately total: every field is optional in the wire
/// format, and anything unusable is dropped or nulled rather than crashing.
/// An item the app cannot line up with its own catalog stays [unresolved] —
/// the app never invents a food, a gram weight or a nutrition value.
class AnalysisItemResult {
  const AnalysisItemResult({
    required this.id,
    required this.displayName,
    required this.foodId,
    required this.sourceFoodCode,
    required this.canonicalName,
    required this.matchKind,
    required this.amount,
    required this.unit,
    required this.grams,
    required this.portionEstimated,
    required this.confidence,
    required this.unresolved,
    required this.nutrition,
  });

  final String id;
  final String displayName;

  /// Server-side canonical id (the `/v1/foods/:id` namespace).
  final String? foodId;

  /// Bridge to the local cache: FCT foods are keyed by source food code.
  final String? sourceFoodCode;
  final String? canonicalName;
  final String matchKind;
  final double amount;
  final String unit;
  final double grams;
  final bool portionEstimated;
  final double confidence;
  final bool unresolved;
  final AnalysisNutrition? nutrition;

  /// The item the user can act on: a resolved portion with nutrition.
  bool get isLoggable => !unresolved && nutrition != null && grams > 0;
}

/// Nutrition for one item or for the meal total.
class AnalysisNutrition {
  const AnalysisNutrition({
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.fiberG,
    this.sodiumMg,
  });

  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final double? sodiumMg;
}

/// A ranked alternative offered by the low-confidence screen (SCAN-06).
class AnalysisCandidateResult {
  const AnalysisCandidateResult({
    required this.displayName,
    required this.foodId,
    required this.confidence,
  });

  final String displayName;
  final String? foodId;
  final double confidence;
}

class AnalysisResult {
  const AnalysisResult({
    required this.id,
    required this.inputKind,
    required this.confidenceState,
    required this.overallConfidence,
    required this.items,
    required this.totals,
    required this.candidates,
    required this.notes,
  });

  final String id;

  /// `photo` | `text`.
  final String inputKind;

  /// `High` | `Medium` | `Low`.
  final String confidenceState;
  final double overallConfidence;
  final List<AnalysisItemResult> items;
  final AnalysisNutrition totals;
  final List<AnalysisCandidateResult> candidates;
  final List<String> notes;

  bool get isLowConfidence => confidenceState == 'Low';
}

/// Thrown for any transport, timeout, HTTP or parse failure. [code] carries the
/// server's error code when it sent one, so the UI can say something true.
class AnalysisException implements Exception {
  AnalysisException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => 'AnalysisException($code): $message';
}

/// Map a `/v1/analyses` payload. Throws [AnalysisException] when the payload is
/// not usable at all (no id, no item list).
AnalysisResult mapAnalysisResult(Map<String, dynamic> json) {
  final Object? id = json['id'];
  if (id is! String || id.isEmpty) {
    throw AnalysisException('analysis response has no id', code: 'MALFORMED');
  }
  final Object? rawItems = json['items'];
  if (rawItems is! List) {
    throw AnalysisException('analysis response has no items', code: 'MALFORMED');
  }

  final List<AnalysisItemResult> items = <AnalysisItemResult>[];
  for (final Object? raw in rawItems) {
    if (raw is! Map<String, dynamic>) {
      developer.log('analysis item is not an object — skipped', name: 'analysis');
      continue;
    }
    final AnalysisItemResult? item = _mapItem(raw);
    if (item != null) items.add(item);
  }

  final List<AnalysisCandidateResult> candidates = <AnalysisCandidateResult>[];
  final Object? rawCandidates = json['candidates'];
  if (rawCandidates is List) {
    for (final Object? raw in rawCandidates) {
      if (raw is! Map<String, dynamic>) continue;
      final Object? name = raw['displayName'];
      if (name is! String || name.isEmpty) continue;
      candidates.add(
        AnalysisCandidateResult(
          displayName: name,
          foodId: raw['foodId'] is String ? raw['foodId'] as String : null,
          confidence: _double(raw['confidence']) ?? 0,
        ),
      );
    }
  }

  return AnalysisResult(
    id: id,
    inputKind: json['inputKind'] is String ? json['inputKind'] as String : 'text',
    confidenceState:
        json['confidenceState'] is String ? json['confidenceState'] as String : 'Low',
    overallConfidence: _double(json['overallConfidence']) ?? 0,
    items: items,
    totals: _nutrition(json['totals']) ??
        const AnalysisNutrition(kcal: 0, proteinG: 0, carbsG: 0, fatG: 0),
    candidates: candidates,
    notes: <String>[
      if (json['notes'] is List)
        for (final Object? note in json['notes'] as List)
          if (note is String) note,
    ],
  );
}

AnalysisItemResult? _mapItem(Map<String, dynamic> json) {
  final Object? id = json['id'];
  final Object? displayName = json['displayName'];
  if (id is! String || displayName is! String || displayName.isEmpty) {
    developer.log('analysis item missing id/name — skipped', name: 'analysis');
    return null;
  }
  final Map<String, dynamic>? portion =
      json['portion'] is Map<String, dynamic> ? json['portion'] as Map<String, dynamic> : null;
  final double grams = _double(portion?['grams']) ?? 0;

  return AnalysisItemResult(
    id: id,
    displayName: displayName,
    foodId: json['foodId'] is String ? json['foodId'] as String : null,
    sourceFoodCode:
        json['sourceFoodCode'] is String ? json['sourceFoodCode'] as String : null,
    canonicalName: json['canonicalName'] is String ? json['canonicalName'] as String : null,
    matchKind: json['matchKind'] is String ? json['matchKind'] as String : 'none',
    amount: _double(portion?['amount']) ?? 1,
    unit: portion?['unit'] is String ? portion!['unit'] as String : 'serving',
    grams: grams,
    portionEstimated: portion?['estimated'] == true,
    confidence: _double(json['confidence']) ?? 0,
    unresolved: json['unresolved'] == true,
    nutrition: _nutrition(json['nutrition']),
  );
}

AnalysisNutrition? _nutrition(Object? raw) {
  if (raw is! Map<String, dynamic>) return null;
  final double? kcal = _double(raw['kcal']);
  if (kcal == null) return null;
  return AnalysisNutrition(
    kcal: kcal,
    proteinG: _double(raw['proteinG']) ?? 0,
    carbsG: _double(raw['carbsG']) ?? 0,
    fatG: _double(raw['fatG']) ?? 0,
    fiberG: _double(raw['fiberG']),
    sodiumMg: _double(raw['sodiumMg']),
  );
}

double? _double(Object? value) => value is num ? value.toDouble() : null;
