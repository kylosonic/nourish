import 'package:flutter_test/flutter_test.dart';
import 'package:nourish_domain/domain.dart';

import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/models/sync_operation.dart';
import 'package:nourish_mobile/data/repositories/meal_repository.dart';
import 'package:nourish_mobile/data/repositories/sync_queue_repository.dart';
import 'package:nourish_mobile/data/repositories/water_repository.dart';
import 'package:nourish_mobile/data/repositories/weight_repository.dart';

import 'test_helpers.dart';
import 'widget/seed_helpers.dart';

/// OFF-02 on the device: every local change leaves a queued operation behind,
/// with the identity and the wire shape the server expects.
void main() {
  late AppDatabase db;
  late SyncQueueRepository queue;

  setUp(() async {
    db = await openSeededDb();
    queue = SyncQueueRepository(db);
  });

  tearDown(() async => db.close());

  /// One meal of [kcal] on today's key.
  Future<Meal> logMeal({double kcal = 500, MealSlot slot = MealSlot.lunch}) {
    return MealRepository(db).saveMeal(
      slot,
      <MealItemDraft>[
        MealItemDraft(
          food: testFood(id: 'sync_food', name: 'Sync Food', kcal: kcal),
          unit: PortionUnit.grams,
          quantity: 1,
        ),
      ],
      dateKey: '2026-09-20',
    );
  }

  group('the queue records what the device did', () {
    test('nothing is queued on a fresh install', () async {
      expect(await queue.pendingCount(), 0);
    });

    test('logging a meal queues one upsert carrying its frozen snapshot',
        () async {
      final Meal meal = await logMeal(kcal: 500);

      final List<QueuedOperation> pending = await queue.pending();
      expect(pending, hasLength(1));
      final QueuedOperation op = pending.single;
      expect(op.kind, 'meal');
      expect(op.op, 'upsert');
      // The operation is stored as the wire body, and decodes to itself.
      expect(op.operation.kind, SyncKind.meal);
      expect(op.operation.dateKey, '2026-09-20');
      expect(op.operation.slot, MealSlot.lunch);
      expect(op.operation.items.single.kcal, 500);
      expect(op.operation.items.single.foodName, 'Sync Food');
      // The identity carries the install prefix, so another device's meal
      // cannot collide with this one on the server.
      expect(op.clientId, endsWith(':meal:${meal.id}'));
      expect(op.clientId.split(':').first, hasLength(12));
    });

    test('deleting a meal queues a tombstone in the same transaction',
        () async {
      final Meal meal = await logMeal();
      await MealRepository(db).deleteMeal(int.parse(meal.id));

      final List<QueuedOperation> pending = await queue.pending();
      expect(pending, hasLength(2), reason: 'the upsert, then the tombstone');
      expect(pending.last.op, 'delete');
      expect(pending.last.kind, 'meal');
      // The same row, so the server applies the delete to what it stored.
      expect(pending.last.clientId, pending.first.clientId);
      expect(await MealRepository(db).allMeals(), isEmpty);
    });

    test('water additions and removals queue their signed amounts', () async {
      final WaterRepository water = WaterRepository(db);
      await water.addMl(dateKey: '2026-09-20');
      await water.removeMl(amountMl: 100, dateKey: '2026-09-20');

      final List<QueuedOperation> pending = await queue.pending();
      expect(pending.map((QueuedOperation op) => op.operation.amountMl).toList(),
          <int>[250, -100]);
      expect(
        pending.every((QueuedOperation op) => op.kind == 'water'),
        isTrue,
      );
      expect(pending.first.operation.dateKey, '2026-09-20');
    });

    test('a weight entry queues its measured day, not the typing day', () async {
      await WeightRepository(db).log(
        weightKg: 68.5,
        dateKey: '2026-08-01',
        loggedAt: DateTime.parse('2026-09-20T08:00:00'),
      );

      final QueuedOperation op = (await queue.pending()).single;
      expect(op.kind, 'weight');
      expect(op.operation.weightKg, 68.5);
      expect(
        op.operation.dateKey,
        '2026-08-01',
        reason: 'a back-filled entry must not be filed under the day it was '
            'typed',
      );
      expect(
        op.operation.loggedAt!.toUtc(),
        DateTime.parse('2026-09-20T08:00:00').toUtc(),
        reason: 'the instant is preserved; the wire form is UTC',
      );
    });

    test('the client id is stable for the same local row', () async {
      final Meal meal = await logMeal();
      final String first = (await queue.pending()).single.clientId;

      // The same row queued again (an edit path) keeps its identity.
      await queue.enqueue(
        'meal',
        int.parse(meal.id),
        SyncOperation(
          clientId: '',
          kind: SyncKind.meal,
          op: SyncOp.upsert,
          updatedAt: DateTime.parse('2026-09-20T12:00:00'),
          dateKey: meal.dateKey,
          slot: meal.slot,
        ),
      );

      final List<QueuedOperation> pending = await queue.pending();
      expect(pending, hasLength(2));
      expect(pending[1].clientId, first);
    });

    test('markDone drops only the operations the server took', () async {
      await logMeal();
      await WeightRepository(db).log(weightKg: 70);

      final List<QueuedOperation> pending = await queue.pending();
      await queue.markDone(<int>[pending.first.id]);

      final List<QueuedOperation> left = await queue.pending();
      expect(left, hasLength(1));
      expect(left.single.kind, 'weight');
      expect(await queue.pendingCount(), 1);
    });

    test('a refusal keeps the operation and records why', () async {
      await logMeal();
      final QueuedOperation op = (await queue.pending()).single;

      await queue.recordFailure(op.id, 'the server refused this change');

      final QueuedOperation kept = (await queue.pending()).single;
      expect(kept.id, op.id);
      expect(kept.attempts, 1);
      expect(kept.lastError, 'the server refused this change');
    });
  });

  group('SyncOperation wire shape', () {
    test('encodes the fields the server validates, and round-trips', () {
      final SyncOperation operation = SyncOperation(
        clientId: 'abc123abc123:meal:7',
        kind: SyncKind.meal,
        op: SyncOp.upsert,
        updatedAt: DateTime.parse('2026-09-20T10:00:00Z'),
        loggedAt: DateTime.parse('2026-09-20T09:30:00Z'),
        dateKey: '2026-09-20',
        slot: MealSlot.breakfast,
        items: const <SyncOperationItem>[
          SyncOperationItem(
            clientId: 'abc123abc123:item:11',
            foodId: 'shiro_wot',
            foodName: 'Shiro Wot',
            portionUnit: 'cup',
            portionQuantity: 1,
            grams: 240,
            kcal: 281,
            proteinG: 12,
            carbsG: 30,
            fatG: 11,
            fiberG: 6.5,
            sodiumMg: 320,
          ),
        ],
      );

      final Map<String, dynamic> json = operation.toJson();
      expect(json['kind'], 'meal');
      expect(json['op'], 'upsert');
      expect(json['clientId'], 'abc123abc123:meal:7');
      // Times go to the wire in UTC, whatever the device's zone is.
      expect(json['updatedAt'], '2026-09-20T10:00:00.000Z');
      expect(json['slot'], 'breakfast');
      expect((json['items'] as List<dynamic>).single, isA<Map<String, dynamic>>());

      final SyncOperation decoded = SyncOperation.decode(operation.encode());
      expect(decoded.clientId, operation.clientId);
      expect(decoded.updatedAt.toUtc(), operation.updatedAt.toUtc());
      expect(decoded.items.single.foodId, 'shiro_wot');
      expect(decoded.items.single.fiberG, 6.5);
      expect(decoded.slot, MealSlot.breakfast);
    });

    test('a weight operation omits fields it does not use', () {
      final SyncOperation operation = SyncOperation(
        clientId: 'id:weight:3',
        kind: SyncKind.weight,
        op: SyncOp.upsert,
        updatedAt: DateTime.parse('2026-09-20T07:00:00Z'),
        dateKey: '2026-09-20',
        weightKg: 68.4,
      );
      final Map<String, dynamic> json = operation.toJson();
      expect(json.containsKey('items'), isFalse);
      expect(json.containsKey('amountMl'), isFalse);
      expect(json['weightKg'], 68.4);
    });

    test('withClientId replaces the placeholder the caller left', () {
      final SyncOperation operation = SyncOperation(
        clientId: '',
        kind: SyncKind.water,
        op: SyncOp.upsert,
        updatedAt: DateTime.parse('2026-09-20T07:00:00Z'),
        amountMl: 250,
      );
      expect(operation.withClientId('device:water:1').clientId, 'device:water:1');
      expect(operation.withClientId('device:water:1').amountMl, 250);
    });
  });
}
