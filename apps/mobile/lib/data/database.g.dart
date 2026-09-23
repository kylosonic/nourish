// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $UserProfileTableTable extends UserProfileTable
    with TableInfo<$UserProfileTableTable, UserProfileRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UserProfileTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _languageMeta = const VerificationMeta(
    'language',
  );
  @override
  late final GeneratedColumn<String> language = GeneratedColumn<String>(
    'language',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('en'),
  );
  static const VerificationMeta _goalMeta = const VerificationMeta('goal');
  @override
  late final GeneratedColumn<String> goal = GeneratedColumn<String>(
    'goal',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sexMeta = const VerificationMeta('sex');
  @override
  late final GeneratedColumn<String> sex = GeneratedColumn<String>(
    'sex',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ageMeta = const VerificationMeta('age');
  @override
  late final GeneratedColumn<int> age = GeneratedColumn<int>(
    'age',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _heightCmMeta = const VerificationMeta(
    'heightCm',
  );
  @override
  late final GeneratedColumn<double> heightCm = GeneratedColumn<double>(
    'height_cm',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _currentWeightKgMeta = const VerificationMeta(
    'currentWeightKg',
  );
  @override
  late final GeneratedColumn<double> currentWeightKg = GeneratedColumn<double>(
    'current_weight_kg',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _targetWeightKgMeta = const VerificationMeta(
    'targetWeightKg',
  );
  @override
  late final GeneratedColumn<double> targetWeightKg = GeneratedColumn<double>(
    'target_weight_kg',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _activityMeta = const VerificationMeta(
    'activity',
  );
  @override
  late final GeneratedColumn<String> activity = GeneratedColumn<String>(
    'activity',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _paceMeta = const VerificationMeta('pace');
  @override
  late final GeneratedColumn<String> pace = GeneratedColumn<String>(
    'pace',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _foodPreferenceMeta = const VerificationMeta(
    'foodPreference',
  );
  @override
  late final GeneratedColumn<String> foodPreference = GeneratedColumn<String>(
    'food_preference',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _waterTargetMlMeta = const VerificationMeta(
    'waterTargetMl',
  );
  @override
  late final GeneratedColumn<int> waterTargetMl = GeneratedColumn<int>(
    'water_target_ml',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _onboardingCompleteMeta =
      const VerificationMeta('onboardingComplete');
  @override
  late final GeneratedColumn<bool> onboardingComplete = GeneratedColumn<bool>(
    'onboarding_complete',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("onboarding_complete" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _currentOnboardingStepMeta =
      const VerificationMeta('currentOnboardingStep');
  @override
  late final GeneratedColumn<int> currentOnboardingStep = GeneratedColumn<int>(
    'current_onboarding_step',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    language,
    goal,
    sex,
    age,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activity,
    pace,
    foodPreference,
    waterTargetMl,
    onboardingComplete,
    currentOnboardingStep,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_profile_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<UserProfileRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('language')) {
      context.handle(
        _languageMeta,
        language.isAcceptableOrUnknown(data['language']!, _languageMeta),
      );
    }
    if (data.containsKey('goal')) {
      context.handle(
        _goalMeta,
        goal.isAcceptableOrUnknown(data['goal']!, _goalMeta),
      );
    }
    if (data.containsKey('sex')) {
      context.handle(
        _sexMeta,
        sex.isAcceptableOrUnknown(data['sex']!, _sexMeta),
      );
    }
    if (data.containsKey('age')) {
      context.handle(
        _ageMeta,
        age.isAcceptableOrUnknown(data['age']!, _ageMeta),
      );
    }
    if (data.containsKey('height_cm')) {
      context.handle(
        _heightCmMeta,
        heightCm.isAcceptableOrUnknown(data['height_cm']!, _heightCmMeta),
      );
    }
    if (data.containsKey('current_weight_kg')) {
      context.handle(
        _currentWeightKgMeta,
        currentWeightKg.isAcceptableOrUnknown(
          data['current_weight_kg']!,
          _currentWeightKgMeta,
        ),
      );
    }
    if (data.containsKey('target_weight_kg')) {
      context.handle(
        _targetWeightKgMeta,
        targetWeightKg.isAcceptableOrUnknown(
          data['target_weight_kg']!,
          _targetWeightKgMeta,
        ),
      );
    }
    if (data.containsKey('activity')) {
      context.handle(
        _activityMeta,
        activity.isAcceptableOrUnknown(data['activity']!, _activityMeta),
      );
    }
    if (data.containsKey('pace')) {
      context.handle(
        _paceMeta,
        pace.isAcceptableOrUnknown(data['pace']!, _paceMeta),
      );
    }
    if (data.containsKey('food_preference')) {
      context.handle(
        _foodPreferenceMeta,
        foodPreference.isAcceptableOrUnknown(
          data['food_preference']!,
          _foodPreferenceMeta,
        ),
      );
    }
    if (data.containsKey('water_target_ml')) {
      context.handle(
        _waterTargetMlMeta,
        waterTargetMl.isAcceptableOrUnknown(
          data['water_target_ml']!,
          _waterTargetMlMeta,
        ),
      );
    }
    if (data.containsKey('onboarding_complete')) {
      context.handle(
        _onboardingCompleteMeta,
        onboardingComplete.isAcceptableOrUnknown(
          data['onboarding_complete']!,
          _onboardingCompleteMeta,
        ),
      );
    }
    if (data.containsKey('current_onboarding_step')) {
      context.handle(
        _currentOnboardingStepMeta,
        currentOnboardingStep.isAcceptableOrUnknown(
          data['current_onboarding_step']!,
          _currentOnboardingStepMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => const {};
  @override
  UserProfileRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return UserProfileRow(
      language: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}language'],
      )!,
      goal: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}goal'],
      ),
      sex: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sex'],
      ),
      age: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}age'],
      ),
      heightCm: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}height_cm'],
      ),
      currentWeightKg: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}current_weight_kg'],
      ),
      targetWeightKg: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}target_weight_kg'],
      ),
      activity: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}activity'],
      ),
      pace: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pace'],
      ),
      foodPreference: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}food_preference'],
      ),
      waterTargetMl: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}water_target_ml'],
      ),
      onboardingComplete: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}onboarding_complete'],
      )!,
      currentOnboardingStep: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}current_onboarding_step'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $UserProfileTableTable createAlias(String alias) {
    return $UserProfileTableTable(attachedDatabase, alias);
  }
}

class UserProfileRow extends DataClass implements Insertable<UserProfileRow> {
  final String language;
  final String? goal;
  final String? sex;
  final int? age;
  final double? heightCm;
  final double? currentWeightKg;
  final double? targetWeightKg;
  final String? activity;
  final String? pace;
  final String? foodPreference;

  /// The user's daily water goal in millilitres (WW-01). Null means "never
  /// adjusted", which is not the same as the default value: the app can then
  /// change its documented default without overwriting a user's own choice.
  final int? waterTargetMl;
  final bool onboardingComplete;

  /// Number of completed counted onboarding steps (0..T), see
  /// `firstUnansweredRoute` in `router/app_router.dart`.
  final int currentOnboardingStep;
  final DateTime createdAt;
  final DateTime updatedAt;
  const UserProfileRow({
    required this.language,
    this.goal,
    this.sex,
    this.age,
    this.heightCm,
    this.currentWeightKg,
    this.targetWeightKg,
    this.activity,
    this.pace,
    this.foodPreference,
    this.waterTargetMl,
    required this.onboardingComplete,
    required this.currentOnboardingStep,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['language'] = Variable<String>(language);
    if (!nullToAbsent || goal != null) {
      map['goal'] = Variable<String>(goal);
    }
    if (!nullToAbsent || sex != null) {
      map['sex'] = Variable<String>(sex);
    }
    if (!nullToAbsent || age != null) {
      map['age'] = Variable<int>(age);
    }
    if (!nullToAbsent || heightCm != null) {
      map['height_cm'] = Variable<double>(heightCm);
    }
    if (!nullToAbsent || currentWeightKg != null) {
      map['current_weight_kg'] = Variable<double>(currentWeightKg);
    }
    if (!nullToAbsent || targetWeightKg != null) {
      map['target_weight_kg'] = Variable<double>(targetWeightKg);
    }
    if (!nullToAbsent || activity != null) {
      map['activity'] = Variable<String>(activity);
    }
    if (!nullToAbsent || pace != null) {
      map['pace'] = Variable<String>(pace);
    }
    if (!nullToAbsent || foodPreference != null) {
      map['food_preference'] = Variable<String>(foodPreference);
    }
    if (!nullToAbsent || waterTargetMl != null) {
      map['water_target_ml'] = Variable<int>(waterTargetMl);
    }
    map['onboarding_complete'] = Variable<bool>(onboardingComplete);
    map['current_onboarding_step'] = Variable<int>(currentOnboardingStep);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  UserProfileTableCompanion toCompanion(bool nullToAbsent) {
    return UserProfileTableCompanion(
      language: Value(language),
      goal: goal == null && nullToAbsent ? const Value.absent() : Value(goal),
      sex: sex == null && nullToAbsent ? const Value.absent() : Value(sex),
      age: age == null && nullToAbsent ? const Value.absent() : Value(age),
      heightCm: heightCm == null && nullToAbsent
          ? const Value.absent()
          : Value(heightCm),
      currentWeightKg: currentWeightKg == null && nullToAbsent
          ? const Value.absent()
          : Value(currentWeightKg),
      targetWeightKg: targetWeightKg == null && nullToAbsent
          ? const Value.absent()
          : Value(targetWeightKg),
      activity: activity == null && nullToAbsent
          ? const Value.absent()
          : Value(activity),
      pace: pace == null && nullToAbsent ? const Value.absent() : Value(pace),
      foodPreference: foodPreference == null && nullToAbsent
          ? const Value.absent()
          : Value(foodPreference),
      waterTargetMl: waterTargetMl == null && nullToAbsent
          ? const Value.absent()
          : Value(waterTargetMl),
      onboardingComplete: Value(onboardingComplete),
      currentOnboardingStep: Value(currentOnboardingStep),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory UserProfileRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return UserProfileRow(
      language: serializer.fromJson<String>(json['language']),
      goal: serializer.fromJson<String?>(json['goal']),
      sex: serializer.fromJson<String?>(json['sex']),
      age: serializer.fromJson<int?>(json['age']),
      heightCm: serializer.fromJson<double?>(json['heightCm']),
      currentWeightKg: serializer.fromJson<double?>(json['currentWeightKg']),
      targetWeightKg: serializer.fromJson<double?>(json['targetWeightKg']),
      activity: serializer.fromJson<String?>(json['activity']),
      pace: serializer.fromJson<String?>(json['pace']),
      foodPreference: serializer.fromJson<String?>(json['foodPreference']),
      waterTargetMl: serializer.fromJson<int?>(json['waterTargetMl']),
      onboardingComplete: serializer.fromJson<bool>(json['onboardingComplete']),
      currentOnboardingStep: serializer.fromJson<int>(
        json['currentOnboardingStep'],
      ),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'language': serializer.toJson<String>(language),
      'goal': serializer.toJson<String?>(goal),
      'sex': serializer.toJson<String?>(sex),
      'age': serializer.toJson<int?>(age),
      'heightCm': serializer.toJson<double?>(heightCm),
      'currentWeightKg': serializer.toJson<double?>(currentWeightKg),
      'targetWeightKg': serializer.toJson<double?>(targetWeightKg),
      'activity': serializer.toJson<String?>(activity),
      'pace': serializer.toJson<String?>(pace),
      'foodPreference': serializer.toJson<String?>(foodPreference),
      'waterTargetMl': serializer.toJson<int?>(waterTargetMl),
      'onboardingComplete': serializer.toJson<bool>(onboardingComplete),
      'currentOnboardingStep': serializer.toJson<int>(currentOnboardingStep),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  UserProfileRow copyWith({
    String? language,
    Value<String?> goal = const Value.absent(),
    Value<String?> sex = const Value.absent(),
    Value<int?> age = const Value.absent(),
    Value<double?> heightCm = const Value.absent(),
    Value<double?> currentWeightKg = const Value.absent(),
    Value<double?> targetWeightKg = const Value.absent(),
    Value<String?> activity = const Value.absent(),
    Value<String?> pace = const Value.absent(),
    Value<String?> foodPreference = const Value.absent(),
    Value<int?> waterTargetMl = const Value.absent(),
    bool? onboardingComplete,
    int? currentOnboardingStep,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => UserProfileRow(
    language: language ?? this.language,
    goal: goal.present ? goal.value : this.goal,
    sex: sex.present ? sex.value : this.sex,
    age: age.present ? age.value : this.age,
    heightCm: heightCm.present ? heightCm.value : this.heightCm,
    currentWeightKg: currentWeightKg.present
        ? currentWeightKg.value
        : this.currentWeightKg,
    targetWeightKg: targetWeightKg.present
        ? targetWeightKg.value
        : this.targetWeightKg,
    activity: activity.present ? activity.value : this.activity,
    pace: pace.present ? pace.value : this.pace,
    foodPreference: foodPreference.present
        ? foodPreference.value
        : this.foodPreference,
    waterTargetMl: waterTargetMl.present
        ? waterTargetMl.value
        : this.waterTargetMl,
    onboardingComplete: onboardingComplete ?? this.onboardingComplete,
    currentOnboardingStep: currentOnboardingStep ?? this.currentOnboardingStep,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  UserProfileRow copyWithCompanion(UserProfileTableCompanion data) {
    return UserProfileRow(
      language: data.language.present ? data.language.value : this.language,
      goal: data.goal.present ? data.goal.value : this.goal,
      sex: data.sex.present ? data.sex.value : this.sex,
      age: data.age.present ? data.age.value : this.age,
      heightCm: data.heightCm.present ? data.heightCm.value : this.heightCm,
      currentWeightKg: data.currentWeightKg.present
          ? data.currentWeightKg.value
          : this.currentWeightKg,
      targetWeightKg: data.targetWeightKg.present
          ? data.targetWeightKg.value
          : this.targetWeightKg,
      activity: data.activity.present ? data.activity.value : this.activity,
      pace: data.pace.present ? data.pace.value : this.pace,
      foodPreference: data.foodPreference.present
          ? data.foodPreference.value
          : this.foodPreference,
      waterTargetMl: data.waterTargetMl.present
          ? data.waterTargetMl.value
          : this.waterTargetMl,
      onboardingComplete: data.onboardingComplete.present
          ? data.onboardingComplete.value
          : this.onboardingComplete,
      currentOnboardingStep: data.currentOnboardingStep.present
          ? data.currentOnboardingStep.value
          : this.currentOnboardingStep,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserProfileRow(')
          ..write('language: $language, ')
          ..write('goal: $goal, ')
          ..write('sex: $sex, ')
          ..write('age: $age, ')
          ..write('heightCm: $heightCm, ')
          ..write('currentWeightKg: $currentWeightKg, ')
          ..write('targetWeightKg: $targetWeightKg, ')
          ..write('activity: $activity, ')
          ..write('pace: $pace, ')
          ..write('foodPreference: $foodPreference, ')
          ..write('waterTargetMl: $waterTargetMl, ')
          ..write('onboardingComplete: $onboardingComplete, ')
          ..write('currentOnboardingStep: $currentOnboardingStep, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    language,
    goal,
    sex,
    age,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activity,
    pace,
    foodPreference,
    waterTargetMl,
    onboardingComplete,
    currentOnboardingStep,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UserProfileRow &&
          other.language == this.language &&
          other.goal == this.goal &&
          other.sex == this.sex &&
          other.age == this.age &&
          other.heightCm == this.heightCm &&
          other.currentWeightKg == this.currentWeightKg &&
          other.targetWeightKg == this.targetWeightKg &&
          other.activity == this.activity &&
          other.pace == this.pace &&
          other.foodPreference == this.foodPreference &&
          other.waterTargetMl == this.waterTargetMl &&
          other.onboardingComplete == this.onboardingComplete &&
          other.currentOnboardingStep == this.currentOnboardingStep &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class UserProfileTableCompanion extends UpdateCompanion<UserProfileRow> {
  final Value<String> language;
  final Value<String?> goal;
  final Value<String?> sex;
  final Value<int?> age;
  final Value<double?> heightCm;
  final Value<double?> currentWeightKg;
  final Value<double?> targetWeightKg;
  final Value<String?> activity;
  final Value<String?> pace;
  final Value<String?> foodPreference;
  final Value<int?> waterTargetMl;
  final Value<bool> onboardingComplete;
  final Value<int> currentOnboardingStep;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const UserProfileTableCompanion({
    this.language = const Value.absent(),
    this.goal = const Value.absent(),
    this.sex = const Value.absent(),
    this.age = const Value.absent(),
    this.heightCm = const Value.absent(),
    this.currentWeightKg = const Value.absent(),
    this.targetWeightKg = const Value.absent(),
    this.activity = const Value.absent(),
    this.pace = const Value.absent(),
    this.foodPreference = const Value.absent(),
    this.waterTargetMl = const Value.absent(),
    this.onboardingComplete = const Value.absent(),
    this.currentOnboardingStep = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  UserProfileTableCompanion.insert({
    this.language = const Value.absent(),
    this.goal = const Value.absent(),
    this.sex = const Value.absent(),
    this.age = const Value.absent(),
    this.heightCm = const Value.absent(),
    this.currentWeightKg = const Value.absent(),
    this.targetWeightKg = const Value.absent(),
    this.activity = const Value.absent(),
    this.pace = const Value.absent(),
    this.foodPreference = const Value.absent(),
    this.waterTargetMl = const Value.absent(),
    this.onboardingComplete = const Value.absent(),
    this.currentOnboardingStep = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  static Insertable<UserProfileRow> custom({
    Expression<String>? language,
    Expression<String>? goal,
    Expression<String>? sex,
    Expression<int>? age,
    Expression<double>? heightCm,
    Expression<double>? currentWeightKg,
    Expression<double>? targetWeightKg,
    Expression<String>? activity,
    Expression<String>? pace,
    Expression<String>? foodPreference,
    Expression<int>? waterTargetMl,
    Expression<bool>? onboardingComplete,
    Expression<int>? currentOnboardingStep,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (language != null) 'language': language,
      if (goal != null) 'goal': goal,
      if (sex != null) 'sex': sex,
      if (age != null) 'age': age,
      if (heightCm != null) 'height_cm': heightCm,
      if (currentWeightKg != null) 'current_weight_kg': currentWeightKg,
      if (targetWeightKg != null) 'target_weight_kg': targetWeightKg,
      if (activity != null) 'activity': activity,
      if (pace != null) 'pace': pace,
      if (foodPreference != null) 'food_preference': foodPreference,
      if (waterTargetMl != null) 'water_target_ml': waterTargetMl,
      if (onboardingComplete != null) 'onboarding_complete': onboardingComplete,
      if (currentOnboardingStep != null)
        'current_onboarding_step': currentOnboardingStep,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  UserProfileTableCompanion copyWith({
    Value<String>? language,
    Value<String?>? goal,
    Value<String?>? sex,
    Value<int?>? age,
    Value<double?>? heightCm,
    Value<double?>? currentWeightKg,
    Value<double?>? targetWeightKg,
    Value<String?>? activity,
    Value<String?>? pace,
    Value<String?>? foodPreference,
    Value<int?>? waterTargetMl,
    Value<bool>? onboardingComplete,
    Value<int>? currentOnboardingStep,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return UserProfileTableCompanion(
      language: language ?? this.language,
      goal: goal ?? this.goal,
      sex: sex ?? this.sex,
      age: age ?? this.age,
      heightCm: heightCm ?? this.heightCm,
      currentWeightKg: currentWeightKg ?? this.currentWeightKg,
      targetWeightKg: targetWeightKg ?? this.targetWeightKg,
      activity: activity ?? this.activity,
      pace: pace ?? this.pace,
      foodPreference: foodPreference ?? this.foodPreference,
      waterTargetMl: waterTargetMl ?? this.waterTargetMl,
      onboardingComplete: onboardingComplete ?? this.onboardingComplete,
      currentOnboardingStep:
          currentOnboardingStep ?? this.currentOnboardingStep,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (language.present) {
      map['language'] = Variable<String>(language.value);
    }
    if (goal.present) {
      map['goal'] = Variable<String>(goal.value);
    }
    if (sex.present) {
      map['sex'] = Variable<String>(sex.value);
    }
    if (age.present) {
      map['age'] = Variable<int>(age.value);
    }
    if (heightCm.present) {
      map['height_cm'] = Variable<double>(heightCm.value);
    }
    if (currentWeightKg.present) {
      map['current_weight_kg'] = Variable<double>(currentWeightKg.value);
    }
    if (targetWeightKg.present) {
      map['target_weight_kg'] = Variable<double>(targetWeightKg.value);
    }
    if (activity.present) {
      map['activity'] = Variable<String>(activity.value);
    }
    if (pace.present) {
      map['pace'] = Variable<String>(pace.value);
    }
    if (foodPreference.present) {
      map['food_preference'] = Variable<String>(foodPreference.value);
    }
    if (waterTargetMl.present) {
      map['water_target_ml'] = Variable<int>(waterTargetMl.value);
    }
    if (onboardingComplete.present) {
      map['onboarding_complete'] = Variable<bool>(onboardingComplete.value);
    }
    if (currentOnboardingStep.present) {
      map['current_onboarding_step'] = Variable<int>(
        currentOnboardingStep.value,
      );
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserProfileTableCompanion(')
          ..write('language: $language, ')
          ..write('goal: $goal, ')
          ..write('sex: $sex, ')
          ..write('age: $age, ')
          ..write('heightCm: $heightCm, ')
          ..write('currentWeightKg: $currentWeightKg, ')
          ..write('targetWeightKg: $targetWeightKg, ')
          ..write('activity: $activity, ')
          ..write('pace: $pace, ')
          ..write('foodPreference: $foodPreference, ')
          ..write('waterTargetMl: $waterTargetMl, ')
          ..write('onboardingComplete: $onboardingComplete, ')
          ..write('currentOnboardingStep: $currentOnboardingStep, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FoodsTable extends Foods with TableInfo<$FoodsTable, FoodsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FoodsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _canonicalNameMeta = const VerificationMeta(
    'canonicalName',
  );
  @override
  late final GeneratedColumn<String> canonicalName = GeneratedColumn<String>(
    'canonical_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _defaultPortionUnitMeta =
      const VerificationMeta('defaultPortionUnit');
  @override
  late final GeneratedColumn<String> defaultPortionUnit =
      GeneratedColumn<String>(
        'default_portion_unit',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _defaultPortionQtyMeta = const VerificationMeta(
    'defaultPortionQty',
  );
  @override
  late final GeneratedColumn<double> defaultPortionQty =
      GeneratedColumn<double>(
        'default_portion_qty',
        aliasedName,
        false,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
        defaultValue: const Constant(1),
      );
  static const VerificationMeta _defaultPortionGramsMeta =
      const VerificationMeta('defaultPortionGrams');
  @override
  late final GeneratedColumn<double> defaultPortionGrams =
      GeneratedColumn<double>(
        'default_portion_grams',
        aliasedName,
        false,
        type: DriftSqlType.double,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _per100gKcalMeta = const VerificationMeta(
    'per100gKcal',
  );
  @override
  late final GeneratedColumn<double> per100gKcal = GeneratedColumn<double>(
    'per100g_kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _per100gProteinMeta = const VerificationMeta(
    'per100gProtein',
  );
  @override
  late final GeneratedColumn<double> per100gProtein = GeneratedColumn<double>(
    'per100g_protein',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _per100gCarbsMeta = const VerificationMeta(
    'per100gCarbs',
  );
  @override
  late final GeneratedColumn<double> per100gCarbs = GeneratedColumn<double>(
    'per100g_carbs',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _per100gFatMeta = const VerificationMeta(
    'per100gFat',
  );
  @override
  late final GeneratedColumn<double> per100gFat = GeneratedColumn<double>(
    'per100g_fat',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _per100gFiberMeta = const VerificationMeta(
    'per100gFiber',
  );
  @override
  late final GeneratedColumn<double> per100gFiber = GeneratedColumn<double>(
    'per100g_fiber',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _per100gSodiumMeta = const VerificationMeta(
    'per100gSodium',
  );
  @override
  late final GeneratedColumn<double> per100gSodium = GeneratedColumn<double>(
    'per100g_sodium',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sourceNameMeta = const VerificationMeta(
    'sourceName',
  );
  @override
  late final GeneratedColumn<String> sourceName = GeneratedColumn<String>(
    'source_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sourceVersionMeta = const VerificationMeta(
    'sourceVersion',
  );
  @override
  late final GeneratedColumn<String> sourceVersion = GeneratedColumn<String>(
    'source_version',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sourceFoodCodeMeta = const VerificationMeta(
    'sourceFoodCode',
  );
  @override
  late final GeneratedColumn<String> sourceFoodCode = GeneratedColumn<String>(
    'source_food_code',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sourceReferenceMeta = const VerificationMeta(
    'sourceReference',
  );
  @override
  late final GeneratedColumn<String> sourceReference = GeneratedColumn<String>(
    'source_reference',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _importDateMeta = const VerificationMeta(
    'importDate',
  );
  @override
  late final GeneratedColumn<DateTime> importDate = GeneratedColumn<DateTime>(
    'import_date',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isSeedMeta = const VerificationMeta('isSeed');
  @override
  late final GeneratedColumn<bool> isSeed = GeneratedColumn<bool>(
    'is_seed',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_seed" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    canonicalName,
    category,
    defaultPortionUnit,
    defaultPortionQty,
    defaultPortionGrams,
    per100gKcal,
    per100gProtein,
    per100gCarbs,
    per100gFat,
    per100gFiber,
    per100gSodium,
    sourceName,
    sourceVersion,
    sourceFoodCode,
    sourceReference,
    importDate,
    isSeed,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'foods';
  @override
  VerificationContext validateIntegrity(
    Insertable<FoodsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('canonical_name')) {
      context.handle(
        _canonicalNameMeta,
        canonicalName.isAcceptableOrUnknown(
          data['canonical_name']!,
          _canonicalNameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_canonicalNameMeta);
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    } else if (isInserting) {
      context.missing(_categoryMeta);
    }
    if (data.containsKey('default_portion_unit')) {
      context.handle(
        _defaultPortionUnitMeta,
        defaultPortionUnit.isAcceptableOrUnknown(
          data['default_portion_unit']!,
          _defaultPortionUnitMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_defaultPortionUnitMeta);
    }
    if (data.containsKey('default_portion_qty')) {
      context.handle(
        _defaultPortionQtyMeta,
        defaultPortionQty.isAcceptableOrUnknown(
          data['default_portion_qty']!,
          _defaultPortionQtyMeta,
        ),
      );
    }
    if (data.containsKey('default_portion_grams')) {
      context.handle(
        _defaultPortionGramsMeta,
        defaultPortionGrams.isAcceptableOrUnknown(
          data['default_portion_grams']!,
          _defaultPortionGramsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_defaultPortionGramsMeta);
    }
    if (data.containsKey('per100g_kcal')) {
      context.handle(
        _per100gKcalMeta,
        per100gKcal.isAcceptableOrUnknown(
          data['per100g_kcal']!,
          _per100gKcalMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_per100gKcalMeta);
    }
    if (data.containsKey('per100g_protein')) {
      context.handle(
        _per100gProteinMeta,
        per100gProtein.isAcceptableOrUnknown(
          data['per100g_protein']!,
          _per100gProteinMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_per100gProteinMeta);
    }
    if (data.containsKey('per100g_carbs')) {
      context.handle(
        _per100gCarbsMeta,
        per100gCarbs.isAcceptableOrUnknown(
          data['per100g_carbs']!,
          _per100gCarbsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_per100gCarbsMeta);
    }
    if (data.containsKey('per100g_fat')) {
      context.handle(
        _per100gFatMeta,
        per100gFat.isAcceptableOrUnknown(data['per100g_fat']!, _per100gFatMeta),
      );
    } else if (isInserting) {
      context.missing(_per100gFatMeta);
    }
    if (data.containsKey('per100g_fiber')) {
      context.handle(
        _per100gFiberMeta,
        per100gFiber.isAcceptableOrUnknown(
          data['per100g_fiber']!,
          _per100gFiberMeta,
        ),
      );
    }
    if (data.containsKey('per100g_sodium')) {
      context.handle(
        _per100gSodiumMeta,
        per100gSodium.isAcceptableOrUnknown(
          data['per100g_sodium']!,
          _per100gSodiumMeta,
        ),
      );
    }
    if (data.containsKey('source_name')) {
      context.handle(
        _sourceNameMeta,
        sourceName.isAcceptableOrUnknown(data['source_name']!, _sourceNameMeta),
      );
    } else if (isInserting) {
      context.missing(_sourceNameMeta);
    }
    if (data.containsKey('source_version')) {
      context.handle(
        _sourceVersionMeta,
        sourceVersion.isAcceptableOrUnknown(
          data['source_version']!,
          _sourceVersionMeta,
        ),
      );
    }
    if (data.containsKey('source_food_code')) {
      context.handle(
        _sourceFoodCodeMeta,
        sourceFoodCode.isAcceptableOrUnknown(
          data['source_food_code']!,
          _sourceFoodCodeMeta,
        ),
      );
    }
    if (data.containsKey('source_reference')) {
      context.handle(
        _sourceReferenceMeta,
        sourceReference.isAcceptableOrUnknown(
          data['source_reference']!,
          _sourceReferenceMeta,
        ),
      );
    }
    if (data.containsKey('import_date')) {
      context.handle(
        _importDateMeta,
        importDate.isAcceptableOrUnknown(data['import_date']!, _importDateMeta),
      );
    }
    if (data.containsKey('is_seed')) {
      context.handle(
        _isSeedMeta,
        isSeed.isAcceptableOrUnknown(data['is_seed']!, _isSeedMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FoodsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FoodsRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      canonicalName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}canonical_name'],
      )!,
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      defaultPortionUnit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}default_portion_unit'],
      )!,
      defaultPortionQty: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}default_portion_qty'],
      )!,
      defaultPortionGrams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}default_portion_grams'],
      )!,
      per100gKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}per100g_kcal'],
      )!,
      per100gProtein: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}per100g_protein'],
      )!,
      per100gCarbs: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}per100g_carbs'],
      )!,
      per100gFat: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}per100g_fat'],
      )!,
      per100gFiber: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}per100g_fiber'],
      ),
      per100gSodium: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}per100g_sodium'],
      ),
      sourceName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_name'],
      )!,
      sourceVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_version'],
      ),
      sourceFoodCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_food_code'],
      ),
      sourceReference: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_reference'],
      ),
      importDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}import_date'],
      ),
      isSeed: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_seed'],
      )!,
    );
  }

  @override
  $FoodsTable createAlias(String alias) {
    return $FoodsTable(attachedDatabase, alias);
  }
}

class FoodsRow extends DataClass implements Insertable<FoodsRow> {
  final String id;
  final String canonicalName;

  /// One of the search-chip categories: Ethiopian, Breakfast, Lunch,
  /// Dinner, Snacks.
  final String category;
  final String defaultPortionUnit;
  final double defaultPortionQty;
  final double defaultPortionGrams;
  final double per100gKcal;
  final double per100gProtein;
  final double per100gCarbs;
  final double per100gFat;
  final double? per100gFiber;
  final double? per100gSodium;
  final String sourceName;
  final String? sourceVersion;

  /// Food code within the source dataset (FCT rows; null for seed rows).
  final String? sourceFoodCode;

  /// Human-readable citation/reference of the source row (FCT rows;
  /// null for seed rows).
  final String? sourceReference;

  /// When the source row was imported (FCT rows; null for seed rows).
  final DateTime? importDate;
  final bool isSeed;
  const FoodsRow({
    required this.id,
    required this.canonicalName,
    required this.category,
    required this.defaultPortionUnit,
    required this.defaultPortionQty,
    required this.defaultPortionGrams,
    required this.per100gKcal,
    required this.per100gProtein,
    required this.per100gCarbs,
    required this.per100gFat,
    this.per100gFiber,
    this.per100gSodium,
    required this.sourceName,
    this.sourceVersion,
    this.sourceFoodCode,
    this.sourceReference,
    this.importDate,
    required this.isSeed,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['canonical_name'] = Variable<String>(canonicalName);
    map['category'] = Variable<String>(category);
    map['default_portion_unit'] = Variable<String>(defaultPortionUnit);
    map['default_portion_qty'] = Variable<double>(defaultPortionQty);
    map['default_portion_grams'] = Variable<double>(defaultPortionGrams);
    map['per100g_kcal'] = Variable<double>(per100gKcal);
    map['per100g_protein'] = Variable<double>(per100gProtein);
    map['per100g_carbs'] = Variable<double>(per100gCarbs);
    map['per100g_fat'] = Variable<double>(per100gFat);
    if (!nullToAbsent || per100gFiber != null) {
      map['per100g_fiber'] = Variable<double>(per100gFiber);
    }
    if (!nullToAbsent || per100gSodium != null) {
      map['per100g_sodium'] = Variable<double>(per100gSodium);
    }
    map['source_name'] = Variable<String>(sourceName);
    if (!nullToAbsent || sourceVersion != null) {
      map['source_version'] = Variable<String>(sourceVersion);
    }
    if (!nullToAbsent || sourceFoodCode != null) {
      map['source_food_code'] = Variable<String>(sourceFoodCode);
    }
    if (!nullToAbsent || sourceReference != null) {
      map['source_reference'] = Variable<String>(sourceReference);
    }
    if (!nullToAbsent || importDate != null) {
      map['import_date'] = Variable<DateTime>(importDate);
    }
    map['is_seed'] = Variable<bool>(isSeed);
    return map;
  }

  FoodsCompanion toCompanion(bool nullToAbsent) {
    return FoodsCompanion(
      id: Value(id),
      canonicalName: Value(canonicalName),
      category: Value(category),
      defaultPortionUnit: Value(defaultPortionUnit),
      defaultPortionQty: Value(defaultPortionQty),
      defaultPortionGrams: Value(defaultPortionGrams),
      per100gKcal: Value(per100gKcal),
      per100gProtein: Value(per100gProtein),
      per100gCarbs: Value(per100gCarbs),
      per100gFat: Value(per100gFat),
      per100gFiber: per100gFiber == null && nullToAbsent
          ? const Value.absent()
          : Value(per100gFiber),
      per100gSodium: per100gSodium == null && nullToAbsent
          ? const Value.absent()
          : Value(per100gSodium),
      sourceName: Value(sourceName),
      sourceVersion: sourceVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(sourceVersion),
      sourceFoodCode: sourceFoodCode == null && nullToAbsent
          ? const Value.absent()
          : Value(sourceFoodCode),
      sourceReference: sourceReference == null && nullToAbsent
          ? const Value.absent()
          : Value(sourceReference),
      importDate: importDate == null && nullToAbsent
          ? const Value.absent()
          : Value(importDate),
      isSeed: Value(isSeed),
    );
  }

  factory FoodsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FoodsRow(
      id: serializer.fromJson<String>(json['id']),
      canonicalName: serializer.fromJson<String>(json['canonicalName']),
      category: serializer.fromJson<String>(json['category']),
      defaultPortionUnit: serializer.fromJson<String>(
        json['defaultPortionUnit'],
      ),
      defaultPortionQty: serializer.fromJson<double>(json['defaultPortionQty']),
      defaultPortionGrams: serializer.fromJson<double>(
        json['defaultPortionGrams'],
      ),
      per100gKcal: serializer.fromJson<double>(json['per100gKcal']),
      per100gProtein: serializer.fromJson<double>(json['per100gProtein']),
      per100gCarbs: serializer.fromJson<double>(json['per100gCarbs']),
      per100gFat: serializer.fromJson<double>(json['per100gFat']),
      per100gFiber: serializer.fromJson<double?>(json['per100gFiber']),
      per100gSodium: serializer.fromJson<double?>(json['per100gSodium']),
      sourceName: serializer.fromJson<String>(json['sourceName']),
      sourceVersion: serializer.fromJson<String?>(json['sourceVersion']),
      sourceFoodCode: serializer.fromJson<String?>(json['sourceFoodCode']),
      sourceReference: serializer.fromJson<String?>(json['sourceReference']),
      importDate: serializer.fromJson<DateTime?>(json['importDate']),
      isSeed: serializer.fromJson<bool>(json['isSeed']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'canonicalName': serializer.toJson<String>(canonicalName),
      'category': serializer.toJson<String>(category),
      'defaultPortionUnit': serializer.toJson<String>(defaultPortionUnit),
      'defaultPortionQty': serializer.toJson<double>(defaultPortionQty),
      'defaultPortionGrams': serializer.toJson<double>(defaultPortionGrams),
      'per100gKcal': serializer.toJson<double>(per100gKcal),
      'per100gProtein': serializer.toJson<double>(per100gProtein),
      'per100gCarbs': serializer.toJson<double>(per100gCarbs),
      'per100gFat': serializer.toJson<double>(per100gFat),
      'per100gFiber': serializer.toJson<double?>(per100gFiber),
      'per100gSodium': serializer.toJson<double?>(per100gSodium),
      'sourceName': serializer.toJson<String>(sourceName),
      'sourceVersion': serializer.toJson<String?>(sourceVersion),
      'sourceFoodCode': serializer.toJson<String?>(sourceFoodCode),
      'sourceReference': serializer.toJson<String?>(sourceReference),
      'importDate': serializer.toJson<DateTime?>(importDate),
      'isSeed': serializer.toJson<bool>(isSeed),
    };
  }

  FoodsRow copyWith({
    String? id,
    String? canonicalName,
    String? category,
    String? defaultPortionUnit,
    double? defaultPortionQty,
    double? defaultPortionGrams,
    double? per100gKcal,
    double? per100gProtein,
    double? per100gCarbs,
    double? per100gFat,
    Value<double?> per100gFiber = const Value.absent(),
    Value<double?> per100gSodium = const Value.absent(),
    String? sourceName,
    Value<String?> sourceVersion = const Value.absent(),
    Value<String?> sourceFoodCode = const Value.absent(),
    Value<String?> sourceReference = const Value.absent(),
    Value<DateTime?> importDate = const Value.absent(),
    bool? isSeed,
  }) => FoodsRow(
    id: id ?? this.id,
    canonicalName: canonicalName ?? this.canonicalName,
    category: category ?? this.category,
    defaultPortionUnit: defaultPortionUnit ?? this.defaultPortionUnit,
    defaultPortionQty: defaultPortionQty ?? this.defaultPortionQty,
    defaultPortionGrams: defaultPortionGrams ?? this.defaultPortionGrams,
    per100gKcal: per100gKcal ?? this.per100gKcal,
    per100gProtein: per100gProtein ?? this.per100gProtein,
    per100gCarbs: per100gCarbs ?? this.per100gCarbs,
    per100gFat: per100gFat ?? this.per100gFat,
    per100gFiber: per100gFiber.present ? per100gFiber.value : this.per100gFiber,
    per100gSodium: per100gSodium.present
        ? per100gSodium.value
        : this.per100gSodium,
    sourceName: sourceName ?? this.sourceName,
    sourceVersion: sourceVersion.present
        ? sourceVersion.value
        : this.sourceVersion,
    sourceFoodCode: sourceFoodCode.present
        ? sourceFoodCode.value
        : this.sourceFoodCode,
    sourceReference: sourceReference.present
        ? sourceReference.value
        : this.sourceReference,
    importDate: importDate.present ? importDate.value : this.importDate,
    isSeed: isSeed ?? this.isSeed,
  );
  FoodsRow copyWithCompanion(FoodsCompanion data) {
    return FoodsRow(
      id: data.id.present ? data.id.value : this.id,
      canonicalName: data.canonicalName.present
          ? data.canonicalName.value
          : this.canonicalName,
      category: data.category.present ? data.category.value : this.category,
      defaultPortionUnit: data.defaultPortionUnit.present
          ? data.defaultPortionUnit.value
          : this.defaultPortionUnit,
      defaultPortionQty: data.defaultPortionQty.present
          ? data.defaultPortionQty.value
          : this.defaultPortionQty,
      defaultPortionGrams: data.defaultPortionGrams.present
          ? data.defaultPortionGrams.value
          : this.defaultPortionGrams,
      per100gKcal: data.per100gKcal.present
          ? data.per100gKcal.value
          : this.per100gKcal,
      per100gProtein: data.per100gProtein.present
          ? data.per100gProtein.value
          : this.per100gProtein,
      per100gCarbs: data.per100gCarbs.present
          ? data.per100gCarbs.value
          : this.per100gCarbs,
      per100gFat: data.per100gFat.present
          ? data.per100gFat.value
          : this.per100gFat,
      per100gFiber: data.per100gFiber.present
          ? data.per100gFiber.value
          : this.per100gFiber,
      per100gSodium: data.per100gSodium.present
          ? data.per100gSodium.value
          : this.per100gSodium,
      sourceName: data.sourceName.present
          ? data.sourceName.value
          : this.sourceName,
      sourceVersion: data.sourceVersion.present
          ? data.sourceVersion.value
          : this.sourceVersion,
      sourceFoodCode: data.sourceFoodCode.present
          ? data.sourceFoodCode.value
          : this.sourceFoodCode,
      sourceReference: data.sourceReference.present
          ? data.sourceReference.value
          : this.sourceReference,
      importDate: data.importDate.present
          ? data.importDate.value
          : this.importDate,
      isSeed: data.isSeed.present ? data.isSeed.value : this.isSeed,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FoodsRow(')
          ..write('id: $id, ')
          ..write('canonicalName: $canonicalName, ')
          ..write('category: $category, ')
          ..write('defaultPortionUnit: $defaultPortionUnit, ')
          ..write('defaultPortionQty: $defaultPortionQty, ')
          ..write('defaultPortionGrams: $defaultPortionGrams, ')
          ..write('per100gKcal: $per100gKcal, ')
          ..write('per100gProtein: $per100gProtein, ')
          ..write('per100gCarbs: $per100gCarbs, ')
          ..write('per100gFat: $per100gFat, ')
          ..write('per100gFiber: $per100gFiber, ')
          ..write('per100gSodium: $per100gSodium, ')
          ..write('sourceName: $sourceName, ')
          ..write('sourceVersion: $sourceVersion, ')
          ..write('sourceFoodCode: $sourceFoodCode, ')
          ..write('sourceReference: $sourceReference, ')
          ..write('importDate: $importDate, ')
          ..write('isSeed: $isSeed')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    canonicalName,
    category,
    defaultPortionUnit,
    defaultPortionQty,
    defaultPortionGrams,
    per100gKcal,
    per100gProtein,
    per100gCarbs,
    per100gFat,
    per100gFiber,
    per100gSodium,
    sourceName,
    sourceVersion,
    sourceFoodCode,
    sourceReference,
    importDate,
    isSeed,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FoodsRow &&
          other.id == this.id &&
          other.canonicalName == this.canonicalName &&
          other.category == this.category &&
          other.defaultPortionUnit == this.defaultPortionUnit &&
          other.defaultPortionQty == this.defaultPortionQty &&
          other.defaultPortionGrams == this.defaultPortionGrams &&
          other.per100gKcal == this.per100gKcal &&
          other.per100gProtein == this.per100gProtein &&
          other.per100gCarbs == this.per100gCarbs &&
          other.per100gFat == this.per100gFat &&
          other.per100gFiber == this.per100gFiber &&
          other.per100gSodium == this.per100gSodium &&
          other.sourceName == this.sourceName &&
          other.sourceVersion == this.sourceVersion &&
          other.sourceFoodCode == this.sourceFoodCode &&
          other.sourceReference == this.sourceReference &&
          other.importDate == this.importDate &&
          other.isSeed == this.isSeed);
}

class FoodsCompanion extends UpdateCompanion<FoodsRow> {
  final Value<String> id;
  final Value<String> canonicalName;
  final Value<String> category;
  final Value<String> defaultPortionUnit;
  final Value<double> defaultPortionQty;
  final Value<double> defaultPortionGrams;
  final Value<double> per100gKcal;
  final Value<double> per100gProtein;
  final Value<double> per100gCarbs;
  final Value<double> per100gFat;
  final Value<double?> per100gFiber;
  final Value<double?> per100gSodium;
  final Value<String> sourceName;
  final Value<String?> sourceVersion;
  final Value<String?> sourceFoodCode;
  final Value<String?> sourceReference;
  final Value<DateTime?> importDate;
  final Value<bool> isSeed;
  final Value<int> rowid;
  const FoodsCompanion({
    this.id = const Value.absent(),
    this.canonicalName = const Value.absent(),
    this.category = const Value.absent(),
    this.defaultPortionUnit = const Value.absent(),
    this.defaultPortionQty = const Value.absent(),
    this.defaultPortionGrams = const Value.absent(),
    this.per100gKcal = const Value.absent(),
    this.per100gProtein = const Value.absent(),
    this.per100gCarbs = const Value.absent(),
    this.per100gFat = const Value.absent(),
    this.per100gFiber = const Value.absent(),
    this.per100gSodium = const Value.absent(),
    this.sourceName = const Value.absent(),
    this.sourceVersion = const Value.absent(),
    this.sourceFoodCode = const Value.absent(),
    this.sourceReference = const Value.absent(),
    this.importDate = const Value.absent(),
    this.isSeed = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FoodsCompanion.insert({
    required String id,
    required String canonicalName,
    required String category,
    required String defaultPortionUnit,
    this.defaultPortionQty = const Value.absent(),
    required double defaultPortionGrams,
    required double per100gKcal,
    required double per100gProtein,
    required double per100gCarbs,
    required double per100gFat,
    this.per100gFiber = const Value.absent(),
    this.per100gSodium = const Value.absent(),
    required String sourceName,
    this.sourceVersion = const Value.absent(),
    this.sourceFoodCode = const Value.absent(),
    this.sourceReference = const Value.absent(),
    this.importDate = const Value.absent(),
    this.isSeed = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       canonicalName = Value(canonicalName),
       category = Value(category),
       defaultPortionUnit = Value(defaultPortionUnit),
       defaultPortionGrams = Value(defaultPortionGrams),
       per100gKcal = Value(per100gKcal),
       per100gProtein = Value(per100gProtein),
       per100gCarbs = Value(per100gCarbs),
       per100gFat = Value(per100gFat),
       sourceName = Value(sourceName);
  static Insertable<FoodsRow> custom({
    Expression<String>? id,
    Expression<String>? canonicalName,
    Expression<String>? category,
    Expression<String>? defaultPortionUnit,
    Expression<double>? defaultPortionQty,
    Expression<double>? defaultPortionGrams,
    Expression<double>? per100gKcal,
    Expression<double>? per100gProtein,
    Expression<double>? per100gCarbs,
    Expression<double>? per100gFat,
    Expression<double>? per100gFiber,
    Expression<double>? per100gSodium,
    Expression<String>? sourceName,
    Expression<String>? sourceVersion,
    Expression<String>? sourceFoodCode,
    Expression<String>? sourceReference,
    Expression<DateTime>? importDate,
    Expression<bool>? isSeed,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (canonicalName != null) 'canonical_name': canonicalName,
      if (category != null) 'category': category,
      if (defaultPortionUnit != null)
        'default_portion_unit': defaultPortionUnit,
      if (defaultPortionQty != null) 'default_portion_qty': defaultPortionQty,
      if (defaultPortionGrams != null)
        'default_portion_grams': defaultPortionGrams,
      if (per100gKcal != null) 'per100g_kcal': per100gKcal,
      if (per100gProtein != null) 'per100g_protein': per100gProtein,
      if (per100gCarbs != null) 'per100g_carbs': per100gCarbs,
      if (per100gFat != null) 'per100g_fat': per100gFat,
      if (per100gFiber != null) 'per100g_fiber': per100gFiber,
      if (per100gSodium != null) 'per100g_sodium': per100gSodium,
      if (sourceName != null) 'source_name': sourceName,
      if (sourceVersion != null) 'source_version': sourceVersion,
      if (sourceFoodCode != null) 'source_food_code': sourceFoodCode,
      if (sourceReference != null) 'source_reference': sourceReference,
      if (importDate != null) 'import_date': importDate,
      if (isSeed != null) 'is_seed': isSeed,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FoodsCompanion copyWith({
    Value<String>? id,
    Value<String>? canonicalName,
    Value<String>? category,
    Value<String>? defaultPortionUnit,
    Value<double>? defaultPortionQty,
    Value<double>? defaultPortionGrams,
    Value<double>? per100gKcal,
    Value<double>? per100gProtein,
    Value<double>? per100gCarbs,
    Value<double>? per100gFat,
    Value<double?>? per100gFiber,
    Value<double?>? per100gSodium,
    Value<String>? sourceName,
    Value<String?>? sourceVersion,
    Value<String?>? sourceFoodCode,
    Value<String?>? sourceReference,
    Value<DateTime?>? importDate,
    Value<bool>? isSeed,
    Value<int>? rowid,
  }) {
    return FoodsCompanion(
      id: id ?? this.id,
      canonicalName: canonicalName ?? this.canonicalName,
      category: category ?? this.category,
      defaultPortionUnit: defaultPortionUnit ?? this.defaultPortionUnit,
      defaultPortionQty: defaultPortionQty ?? this.defaultPortionQty,
      defaultPortionGrams: defaultPortionGrams ?? this.defaultPortionGrams,
      per100gKcal: per100gKcal ?? this.per100gKcal,
      per100gProtein: per100gProtein ?? this.per100gProtein,
      per100gCarbs: per100gCarbs ?? this.per100gCarbs,
      per100gFat: per100gFat ?? this.per100gFat,
      per100gFiber: per100gFiber ?? this.per100gFiber,
      per100gSodium: per100gSodium ?? this.per100gSodium,
      sourceName: sourceName ?? this.sourceName,
      sourceVersion: sourceVersion ?? this.sourceVersion,
      sourceFoodCode: sourceFoodCode ?? this.sourceFoodCode,
      sourceReference: sourceReference ?? this.sourceReference,
      importDate: importDate ?? this.importDate,
      isSeed: isSeed ?? this.isSeed,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (canonicalName.present) {
      map['canonical_name'] = Variable<String>(canonicalName.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (defaultPortionUnit.present) {
      map['default_portion_unit'] = Variable<String>(defaultPortionUnit.value);
    }
    if (defaultPortionQty.present) {
      map['default_portion_qty'] = Variable<double>(defaultPortionQty.value);
    }
    if (defaultPortionGrams.present) {
      map['default_portion_grams'] = Variable<double>(
        defaultPortionGrams.value,
      );
    }
    if (per100gKcal.present) {
      map['per100g_kcal'] = Variable<double>(per100gKcal.value);
    }
    if (per100gProtein.present) {
      map['per100g_protein'] = Variable<double>(per100gProtein.value);
    }
    if (per100gCarbs.present) {
      map['per100g_carbs'] = Variable<double>(per100gCarbs.value);
    }
    if (per100gFat.present) {
      map['per100g_fat'] = Variable<double>(per100gFat.value);
    }
    if (per100gFiber.present) {
      map['per100g_fiber'] = Variable<double>(per100gFiber.value);
    }
    if (per100gSodium.present) {
      map['per100g_sodium'] = Variable<double>(per100gSodium.value);
    }
    if (sourceName.present) {
      map['source_name'] = Variable<String>(sourceName.value);
    }
    if (sourceVersion.present) {
      map['source_version'] = Variable<String>(sourceVersion.value);
    }
    if (sourceFoodCode.present) {
      map['source_food_code'] = Variable<String>(sourceFoodCode.value);
    }
    if (sourceReference.present) {
      map['source_reference'] = Variable<String>(sourceReference.value);
    }
    if (importDate.present) {
      map['import_date'] = Variable<DateTime>(importDate.value);
    }
    if (isSeed.present) {
      map['is_seed'] = Variable<bool>(isSeed.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FoodsCompanion(')
          ..write('id: $id, ')
          ..write('canonicalName: $canonicalName, ')
          ..write('category: $category, ')
          ..write('defaultPortionUnit: $defaultPortionUnit, ')
          ..write('defaultPortionQty: $defaultPortionQty, ')
          ..write('defaultPortionGrams: $defaultPortionGrams, ')
          ..write('per100gKcal: $per100gKcal, ')
          ..write('per100gProtein: $per100gProtein, ')
          ..write('per100gCarbs: $per100gCarbs, ')
          ..write('per100gFat: $per100gFat, ')
          ..write('per100gFiber: $per100gFiber, ')
          ..write('per100gSodium: $per100gSodium, ')
          ..write('sourceName: $sourceName, ')
          ..write('sourceVersion: $sourceVersion, ')
          ..write('sourceFoodCode: $sourceFoodCode, ')
          ..write('sourceReference: $sourceReference, ')
          ..write('importDate: $importDate, ')
          ..write('isSeed: $isSeed, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FoodAliasesTable extends FoodAliases
    with TableInfo<$FoodAliasesTable, FoodAliasesRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FoodAliasesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _foodIdMeta = const VerificationMeta('foodId');
  @override
  late final GeneratedColumn<String> foodId = GeneratedColumn<String>(
    'food_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES foods (id)',
    ),
  );
  static const VerificationMeta _aliasMeta = const VerificationMeta('alias');
  @override
  late final GeneratedColumn<String> alias = GeneratedColumn<String>(
    'alias',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _languageMeta = const VerificationMeta(
    'language',
  );
  @override
  late final GeneratedColumn<String> language = GeneratedColumn<String>(
    'language',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [foodId, alias, language];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'food_aliases';
  @override
  VerificationContext validateIntegrity(
    Insertable<FoodAliasesRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('food_id')) {
      context.handle(
        _foodIdMeta,
        foodId.isAcceptableOrUnknown(data['food_id']!, _foodIdMeta),
      );
    } else if (isInserting) {
      context.missing(_foodIdMeta);
    }
    if (data.containsKey('alias')) {
      context.handle(
        _aliasMeta,
        alias.isAcceptableOrUnknown(data['alias']!, _aliasMeta),
      );
    } else if (isInserting) {
      context.missing(_aliasMeta);
    }
    if (data.containsKey('language')) {
      context.handle(
        _languageMeta,
        language.isAcceptableOrUnknown(data['language']!, _languageMeta),
      );
    } else if (isInserting) {
      context.missing(_languageMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {foodId, alias};
  @override
  FoodAliasesRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FoodAliasesRow(
      foodId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}food_id'],
      )!,
      alias: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}alias'],
      )!,
      language: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}language'],
      )!,
    );
  }

  @override
  $FoodAliasesTable createAlias(String alias) {
    return $FoodAliasesTable(attachedDatabase, alias);
  }
}

class FoodAliasesRow extends DataClass implements Insertable<FoodAliasesRow> {
  final String foodId;
  final String alias;

  /// `AppLanguage.name` of the alias text.
  final String language;
  const FoodAliasesRow({
    required this.foodId,
    required this.alias,
    required this.language,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['food_id'] = Variable<String>(foodId);
    map['alias'] = Variable<String>(alias);
    map['language'] = Variable<String>(language);
    return map;
  }

  FoodAliasesCompanion toCompanion(bool nullToAbsent) {
    return FoodAliasesCompanion(
      foodId: Value(foodId),
      alias: Value(alias),
      language: Value(language),
    );
  }

  factory FoodAliasesRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FoodAliasesRow(
      foodId: serializer.fromJson<String>(json['foodId']),
      alias: serializer.fromJson<String>(json['alias']),
      language: serializer.fromJson<String>(json['language']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'foodId': serializer.toJson<String>(foodId),
      'alias': serializer.toJson<String>(alias),
      'language': serializer.toJson<String>(language),
    };
  }

  FoodAliasesRow copyWith({String? foodId, String? alias, String? language}) =>
      FoodAliasesRow(
        foodId: foodId ?? this.foodId,
        alias: alias ?? this.alias,
        language: language ?? this.language,
      );
  FoodAliasesRow copyWithCompanion(FoodAliasesCompanion data) {
    return FoodAliasesRow(
      foodId: data.foodId.present ? data.foodId.value : this.foodId,
      alias: data.alias.present ? data.alias.value : this.alias,
      language: data.language.present ? data.language.value : this.language,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FoodAliasesRow(')
          ..write('foodId: $foodId, ')
          ..write('alias: $alias, ')
          ..write('language: $language')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(foodId, alias, language);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FoodAliasesRow &&
          other.foodId == this.foodId &&
          other.alias == this.alias &&
          other.language == this.language);
}

class FoodAliasesCompanion extends UpdateCompanion<FoodAliasesRow> {
  final Value<String> foodId;
  final Value<String> alias;
  final Value<String> language;
  final Value<int> rowid;
  const FoodAliasesCompanion({
    this.foodId = const Value.absent(),
    this.alias = const Value.absent(),
    this.language = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FoodAliasesCompanion.insert({
    required String foodId,
    required String alias,
    required String language,
    this.rowid = const Value.absent(),
  }) : foodId = Value(foodId),
       alias = Value(alias),
       language = Value(language);
  static Insertable<FoodAliasesRow> custom({
    Expression<String>? foodId,
    Expression<String>? alias,
    Expression<String>? language,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (foodId != null) 'food_id': foodId,
      if (alias != null) 'alias': alias,
      if (language != null) 'language': language,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FoodAliasesCompanion copyWith({
    Value<String>? foodId,
    Value<String>? alias,
    Value<String>? language,
    Value<int>? rowid,
  }) {
    return FoodAliasesCompanion(
      foodId: foodId ?? this.foodId,
      alias: alias ?? this.alias,
      language: language ?? this.language,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (foodId.present) {
      map['food_id'] = Variable<String>(foodId.value);
    }
    if (alias.present) {
      map['alias'] = Variable<String>(alias.value);
    }
    if (language.present) {
      map['language'] = Variable<String>(language.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FoodAliasesCompanion(')
          ..write('foodId: $foodId, ')
          ..write('alias: $alias, ')
          ..write('language: $language, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FoodPortionsTable extends FoodPortions
    with TableInfo<$FoodPortionsTable, FoodPortionsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FoodPortionsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _foodIdMeta = const VerificationMeta('foodId');
  @override
  late final GeneratedColumn<String> foodId = GeneratedColumn<String>(
    'food_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES foods (id)',
    ),
  );
  static const VerificationMeta _unitMeta = const VerificationMeta('unit');
  @override
  late final GeneratedColumn<String> unit = GeneratedColumn<String>(
    'unit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _quantityMeta = const VerificationMeta(
    'quantity',
  );
  @override
  late final GeneratedColumn<double> quantity = GeneratedColumn<double>(
    'quantity',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
    defaultValue: const Constant(1),
  );
  static const VerificationMeta _gramsMeta = const VerificationMeta('grams');
  @override
  late final GeneratedColumn<double> grams = GeneratedColumn<double>(
    'grams',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [foodId, unit, quantity, grams];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'food_portions';
  @override
  VerificationContext validateIntegrity(
    Insertable<FoodPortionsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('food_id')) {
      context.handle(
        _foodIdMeta,
        foodId.isAcceptableOrUnknown(data['food_id']!, _foodIdMeta),
      );
    } else if (isInserting) {
      context.missing(_foodIdMeta);
    }
    if (data.containsKey('unit')) {
      context.handle(
        _unitMeta,
        unit.isAcceptableOrUnknown(data['unit']!, _unitMeta),
      );
    } else if (isInserting) {
      context.missing(_unitMeta);
    }
    if (data.containsKey('quantity')) {
      context.handle(
        _quantityMeta,
        quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta),
      );
    }
    if (data.containsKey('grams')) {
      context.handle(
        _gramsMeta,
        grams.isAcceptableOrUnknown(data['grams']!, _gramsMeta),
      );
    } else if (isInserting) {
      context.missing(_gramsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {foodId, unit};
  @override
  FoodPortionsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FoodPortionsRow(
      foodId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}food_id'],
      )!,
      unit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}unit'],
      )!,
      quantity: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}quantity'],
      )!,
      grams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}grams'],
      )!,
    );
  }

  @override
  $FoodPortionsTable createAlias(String alias) {
    return $FoodPortionsTable(attachedDatabase, alias);
  }
}

class FoodPortionsRow extends DataClass implements Insertable<FoodPortionsRow> {
  final String foodId;

  /// `PortionUnit.name`.
  final String unit;
  final double quantity;
  final double grams;
  const FoodPortionsRow({
    required this.foodId,
    required this.unit,
    required this.quantity,
    required this.grams,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['food_id'] = Variable<String>(foodId);
    map['unit'] = Variable<String>(unit);
    map['quantity'] = Variable<double>(quantity);
    map['grams'] = Variable<double>(grams);
    return map;
  }

  FoodPortionsCompanion toCompanion(bool nullToAbsent) {
    return FoodPortionsCompanion(
      foodId: Value(foodId),
      unit: Value(unit),
      quantity: Value(quantity),
      grams: Value(grams),
    );
  }

  factory FoodPortionsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FoodPortionsRow(
      foodId: serializer.fromJson<String>(json['foodId']),
      unit: serializer.fromJson<String>(json['unit']),
      quantity: serializer.fromJson<double>(json['quantity']),
      grams: serializer.fromJson<double>(json['grams']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'foodId': serializer.toJson<String>(foodId),
      'unit': serializer.toJson<String>(unit),
      'quantity': serializer.toJson<double>(quantity),
      'grams': serializer.toJson<double>(grams),
    };
  }

  FoodPortionsRow copyWith({
    String? foodId,
    String? unit,
    double? quantity,
    double? grams,
  }) => FoodPortionsRow(
    foodId: foodId ?? this.foodId,
    unit: unit ?? this.unit,
    quantity: quantity ?? this.quantity,
    grams: grams ?? this.grams,
  );
  FoodPortionsRow copyWithCompanion(FoodPortionsCompanion data) {
    return FoodPortionsRow(
      foodId: data.foodId.present ? data.foodId.value : this.foodId,
      unit: data.unit.present ? data.unit.value : this.unit,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      grams: data.grams.present ? data.grams.value : this.grams,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FoodPortionsRow(')
          ..write('foodId: $foodId, ')
          ..write('unit: $unit, ')
          ..write('quantity: $quantity, ')
          ..write('grams: $grams')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(foodId, unit, quantity, grams);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FoodPortionsRow &&
          other.foodId == this.foodId &&
          other.unit == this.unit &&
          other.quantity == this.quantity &&
          other.grams == this.grams);
}

class FoodPortionsCompanion extends UpdateCompanion<FoodPortionsRow> {
  final Value<String> foodId;
  final Value<String> unit;
  final Value<double> quantity;
  final Value<double> grams;
  final Value<int> rowid;
  const FoodPortionsCompanion({
    this.foodId = const Value.absent(),
    this.unit = const Value.absent(),
    this.quantity = const Value.absent(),
    this.grams = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FoodPortionsCompanion.insert({
    required String foodId,
    required String unit,
    this.quantity = const Value.absent(),
    required double grams,
    this.rowid = const Value.absent(),
  }) : foodId = Value(foodId),
       unit = Value(unit),
       grams = Value(grams);
  static Insertable<FoodPortionsRow> custom({
    Expression<String>? foodId,
    Expression<String>? unit,
    Expression<double>? quantity,
    Expression<double>? grams,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (foodId != null) 'food_id': foodId,
      if (unit != null) 'unit': unit,
      if (quantity != null) 'quantity': quantity,
      if (grams != null) 'grams': grams,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FoodPortionsCompanion copyWith({
    Value<String>? foodId,
    Value<String>? unit,
    Value<double>? quantity,
    Value<double>? grams,
    Value<int>? rowid,
  }) {
    return FoodPortionsCompanion(
      foodId: foodId ?? this.foodId,
      unit: unit ?? this.unit,
      quantity: quantity ?? this.quantity,
      grams: grams ?? this.grams,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (foodId.present) {
      map['food_id'] = Variable<String>(foodId.value);
    }
    if (unit.present) {
      map['unit'] = Variable<String>(unit.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<double>(quantity.value);
    }
    if (grams.present) {
      map['grams'] = Variable<double>(grams.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FoodPortionsCompanion(')
          ..write('foodId: $foodId, ')
          ..write('unit: $unit, ')
          ..write('quantity: $quantity, ')
          ..write('grams: $grams, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $DailyTargetsTable extends DailyTargets
    with TableInfo<$DailyTargetsTable, DailyTargetsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DailyTargetsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _targetKcalMeta = const VerificationMeta(
    'targetKcal',
  );
  @override
  late final GeneratedColumn<int> targetKcal = GeneratedColumn<int>(
    'target_kcal',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinGMeta = const VerificationMeta(
    'proteinG',
  );
  @override
  late final GeneratedColumn<int> proteinG = GeneratedColumn<int>(
    'protein_g',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _carbsGMeta = const VerificationMeta('carbsG');
  @override
  late final GeneratedColumn<int> carbsG = GeneratedColumn<int>(
    'carbs_g',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fatGMeta = const VerificationMeta('fatG');
  @override
  late final GeneratedColumn<int> fatG = GeneratedColumn<int>(
    'fat_g',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bmrKcalMeta = const VerificationMeta(
    'bmrKcal',
  );
  @override
  late final GeneratedColumn<double> bmrKcal = GeneratedColumn<double>(
    'bmr_kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tdeeKcalMeta = const VerificationMeta(
    'tdeeKcal',
  );
  @override
  late final GeneratedColumn<double> tdeeKcal = GeneratedColumn<double>(
    'tdee_kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _goalAdjustmentKcalMeta =
      const VerificationMeta('goalAdjustmentKcal');
  @override
  late final GeneratedColumn<double> goalAdjustmentKcal =
      GeneratedColumn<double>(
        'goal_adjustment_kcal',
        aliasedName,
        false,
        type: DriftSqlType.double,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _activityFactorMeta = const VerificationMeta(
    'activityFactor',
  );
  @override
  late final GeneratedColumn<double> activityFactor = GeneratedColumn<double>(
    'activity_factor',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _paceMeta = const VerificationMeta('pace');
  @override
  late final GeneratedColumn<String> pace = GeneratedColumn<String>(
    'pace',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _formulaVersionMeta = const VerificationMeta(
    'formulaVersion',
  );
  @override
  late final GeneratedColumn<String> formulaVersion = GeneratedColumn<String>(
    'formula_version',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dateGeneratedMeta = const VerificationMeta(
    'dateGenerated',
  );
  @override
  late final GeneratedColumn<DateTime> dateGenerated =
      GeneratedColumn<DateTime>(
        'date_generated',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _floorKcalMeta = const VerificationMeta(
    'floorKcal',
  );
  @override
  late final GeneratedColumn<int> floorKcal = GeneratedColumn<int>(
    'floor_kcal',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    targetKcal,
    proteinG,
    carbsG,
    fatG,
    bmrKcal,
    tdeeKcal,
    goalAdjustmentKcal,
    activityFactor,
    pace,
    formulaVersion,
    dateGenerated,
    floorKcal,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'daily_targets';
  @override
  VerificationContext validateIntegrity(
    Insertable<DailyTargetsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('target_kcal')) {
      context.handle(
        _targetKcalMeta,
        targetKcal.isAcceptableOrUnknown(data['target_kcal']!, _targetKcalMeta),
      );
    } else if (isInserting) {
      context.missing(_targetKcalMeta);
    }
    if (data.containsKey('protein_g')) {
      context.handle(
        _proteinGMeta,
        proteinG.isAcceptableOrUnknown(data['protein_g']!, _proteinGMeta),
      );
    } else if (isInserting) {
      context.missing(_proteinGMeta);
    }
    if (data.containsKey('carbs_g')) {
      context.handle(
        _carbsGMeta,
        carbsG.isAcceptableOrUnknown(data['carbs_g']!, _carbsGMeta),
      );
    } else if (isInserting) {
      context.missing(_carbsGMeta);
    }
    if (data.containsKey('fat_g')) {
      context.handle(
        _fatGMeta,
        fatG.isAcceptableOrUnknown(data['fat_g']!, _fatGMeta),
      );
    } else if (isInserting) {
      context.missing(_fatGMeta);
    }
    if (data.containsKey('bmr_kcal')) {
      context.handle(
        _bmrKcalMeta,
        bmrKcal.isAcceptableOrUnknown(data['bmr_kcal']!, _bmrKcalMeta),
      );
    } else if (isInserting) {
      context.missing(_bmrKcalMeta);
    }
    if (data.containsKey('tdee_kcal')) {
      context.handle(
        _tdeeKcalMeta,
        tdeeKcal.isAcceptableOrUnknown(data['tdee_kcal']!, _tdeeKcalMeta),
      );
    } else if (isInserting) {
      context.missing(_tdeeKcalMeta);
    }
    if (data.containsKey('goal_adjustment_kcal')) {
      context.handle(
        _goalAdjustmentKcalMeta,
        goalAdjustmentKcal.isAcceptableOrUnknown(
          data['goal_adjustment_kcal']!,
          _goalAdjustmentKcalMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_goalAdjustmentKcalMeta);
    }
    if (data.containsKey('activity_factor')) {
      context.handle(
        _activityFactorMeta,
        activityFactor.isAcceptableOrUnknown(
          data['activity_factor']!,
          _activityFactorMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_activityFactorMeta);
    }
    if (data.containsKey('pace')) {
      context.handle(
        _paceMeta,
        pace.isAcceptableOrUnknown(data['pace']!, _paceMeta),
      );
    }
    if (data.containsKey('formula_version')) {
      context.handle(
        _formulaVersionMeta,
        formulaVersion.isAcceptableOrUnknown(
          data['formula_version']!,
          _formulaVersionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_formulaVersionMeta);
    }
    if (data.containsKey('date_generated')) {
      context.handle(
        _dateGeneratedMeta,
        dateGenerated.isAcceptableOrUnknown(
          data['date_generated']!,
          _dateGeneratedMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_dateGeneratedMeta);
    }
    if (data.containsKey('floor_kcal')) {
      context.handle(
        _floorKcalMeta,
        floorKcal.isAcceptableOrUnknown(data['floor_kcal']!, _floorKcalMeta),
      );
    } else if (isInserting) {
      context.missing(_floorKcalMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  DailyTargetsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DailyTargetsRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      targetKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}target_kcal'],
      )!,
      proteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}protein_g'],
      )!,
      carbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}carbs_g'],
      )!,
      fatG: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}fat_g'],
      )!,
      bmrKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}bmr_kcal'],
      )!,
      tdeeKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}tdee_kcal'],
      )!,
      goalAdjustmentKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}goal_adjustment_kcal'],
      )!,
      activityFactor: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}activity_factor'],
      )!,
      pace: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pace'],
      ),
      formulaVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}formula_version'],
      )!,
      dateGenerated: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}date_generated'],
      )!,
      floorKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}floor_kcal'],
      )!,
    );
  }

  @override
  $DailyTargetsTable createAlias(String alias) {
    return $DailyTargetsTable(attachedDatabase, alias);
  }
}

class DailyTargetsRow extends DataClass implements Insertable<DailyTargetsRow> {
  final int id;
  final int targetKcal;
  final int proteinG;
  final int carbsG;
  final int fatG;
  final double bmrKcal;
  final double tdeeKcal;
  final double goalAdjustmentKcal;
  final double activityFactor;
  final String? pace;
  final String formulaVersion;
  final DateTime dateGenerated;
  final int floorKcal;
  const DailyTargetsRow({
    required this.id,
    required this.targetKcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.bmrKcal,
    required this.tdeeKcal,
    required this.goalAdjustmentKcal,
    required this.activityFactor,
    this.pace,
    required this.formulaVersion,
    required this.dateGenerated,
    required this.floorKcal,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['target_kcal'] = Variable<int>(targetKcal);
    map['protein_g'] = Variable<int>(proteinG);
    map['carbs_g'] = Variable<int>(carbsG);
    map['fat_g'] = Variable<int>(fatG);
    map['bmr_kcal'] = Variable<double>(bmrKcal);
    map['tdee_kcal'] = Variable<double>(tdeeKcal);
    map['goal_adjustment_kcal'] = Variable<double>(goalAdjustmentKcal);
    map['activity_factor'] = Variable<double>(activityFactor);
    if (!nullToAbsent || pace != null) {
      map['pace'] = Variable<String>(pace);
    }
    map['formula_version'] = Variable<String>(formulaVersion);
    map['date_generated'] = Variable<DateTime>(dateGenerated);
    map['floor_kcal'] = Variable<int>(floorKcal);
    return map;
  }

  DailyTargetsCompanion toCompanion(bool nullToAbsent) {
    return DailyTargetsCompanion(
      id: Value(id),
      targetKcal: Value(targetKcal),
      proteinG: Value(proteinG),
      carbsG: Value(carbsG),
      fatG: Value(fatG),
      bmrKcal: Value(bmrKcal),
      tdeeKcal: Value(tdeeKcal),
      goalAdjustmentKcal: Value(goalAdjustmentKcal),
      activityFactor: Value(activityFactor),
      pace: pace == null && nullToAbsent ? const Value.absent() : Value(pace),
      formulaVersion: Value(formulaVersion),
      dateGenerated: Value(dateGenerated),
      floorKcal: Value(floorKcal),
    );
  }

  factory DailyTargetsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DailyTargetsRow(
      id: serializer.fromJson<int>(json['id']),
      targetKcal: serializer.fromJson<int>(json['targetKcal']),
      proteinG: serializer.fromJson<int>(json['proteinG']),
      carbsG: serializer.fromJson<int>(json['carbsG']),
      fatG: serializer.fromJson<int>(json['fatG']),
      bmrKcal: serializer.fromJson<double>(json['bmrKcal']),
      tdeeKcal: serializer.fromJson<double>(json['tdeeKcal']),
      goalAdjustmentKcal: serializer.fromJson<double>(
        json['goalAdjustmentKcal'],
      ),
      activityFactor: serializer.fromJson<double>(json['activityFactor']),
      pace: serializer.fromJson<String?>(json['pace']),
      formulaVersion: serializer.fromJson<String>(json['formulaVersion']),
      dateGenerated: serializer.fromJson<DateTime>(json['dateGenerated']),
      floorKcal: serializer.fromJson<int>(json['floorKcal']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'targetKcal': serializer.toJson<int>(targetKcal),
      'proteinG': serializer.toJson<int>(proteinG),
      'carbsG': serializer.toJson<int>(carbsG),
      'fatG': serializer.toJson<int>(fatG),
      'bmrKcal': serializer.toJson<double>(bmrKcal),
      'tdeeKcal': serializer.toJson<double>(tdeeKcal),
      'goalAdjustmentKcal': serializer.toJson<double>(goalAdjustmentKcal),
      'activityFactor': serializer.toJson<double>(activityFactor),
      'pace': serializer.toJson<String?>(pace),
      'formulaVersion': serializer.toJson<String>(formulaVersion),
      'dateGenerated': serializer.toJson<DateTime>(dateGenerated),
      'floorKcal': serializer.toJson<int>(floorKcal),
    };
  }

  DailyTargetsRow copyWith({
    int? id,
    int? targetKcal,
    int? proteinG,
    int? carbsG,
    int? fatG,
    double? bmrKcal,
    double? tdeeKcal,
    double? goalAdjustmentKcal,
    double? activityFactor,
    Value<String?> pace = const Value.absent(),
    String? formulaVersion,
    DateTime? dateGenerated,
    int? floorKcal,
  }) => DailyTargetsRow(
    id: id ?? this.id,
    targetKcal: targetKcal ?? this.targetKcal,
    proteinG: proteinG ?? this.proteinG,
    carbsG: carbsG ?? this.carbsG,
    fatG: fatG ?? this.fatG,
    bmrKcal: bmrKcal ?? this.bmrKcal,
    tdeeKcal: tdeeKcal ?? this.tdeeKcal,
    goalAdjustmentKcal: goalAdjustmentKcal ?? this.goalAdjustmentKcal,
    activityFactor: activityFactor ?? this.activityFactor,
    pace: pace.present ? pace.value : this.pace,
    formulaVersion: formulaVersion ?? this.formulaVersion,
    dateGenerated: dateGenerated ?? this.dateGenerated,
    floorKcal: floorKcal ?? this.floorKcal,
  );
  DailyTargetsRow copyWithCompanion(DailyTargetsCompanion data) {
    return DailyTargetsRow(
      id: data.id.present ? data.id.value : this.id,
      targetKcal: data.targetKcal.present
          ? data.targetKcal.value
          : this.targetKcal,
      proteinG: data.proteinG.present ? data.proteinG.value : this.proteinG,
      carbsG: data.carbsG.present ? data.carbsG.value : this.carbsG,
      fatG: data.fatG.present ? data.fatG.value : this.fatG,
      bmrKcal: data.bmrKcal.present ? data.bmrKcal.value : this.bmrKcal,
      tdeeKcal: data.tdeeKcal.present ? data.tdeeKcal.value : this.tdeeKcal,
      goalAdjustmentKcal: data.goalAdjustmentKcal.present
          ? data.goalAdjustmentKcal.value
          : this.goalAdjustmentKcal,
      activityFactor: data.activityFactor.present
          ? data.activityFactor.value
          : this.activityFactor,
      pace: data.pace.present ? data.pace.value : this.pace,
      formulaVersion: data.formulaVersion.present
          ? data.formulaVersion.value
          : this.formulaVersion,
      dateGenerated: data.dateGenerated.present
          ? data.dateGenerated.value
          : this.dateGenerated,
      floorKcal: data.floorKcal.present ? data.floorKcal.value : this.floorKcal,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DailyTargetsRow(')
          ..write('id: $id, ')
          ..write('targetKcal: $targetKcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('bmrKcal: $bmrKcal, ')
          ..write('tdeeKcal: $tdeeKcal, ')
          ..write('goalAdjustmentKcal: $goalAdjustmentKcal, ')
          ..write('activityFactor: $activityFactor, ')
          ..write('pace: $pace, ')
          ..write('formulaVersion: $formulaVersion, ')
          ..write('dateGenerated: $dateGenerated, ')
          ..write('floorKcal: $floorKcal')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    targetKcal,
    proteinG,
    carbsG,
    fatG,
    bmrKcal,
    tdeeKcal,
    goalAdjustmentKcal,
    activityFactor,
    pace,
    formulaVersion,
    dateGenerated,
    floorKcal,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DailyTargetsRow &&
          other.id == this.id &&
          other.targetKcal == this.targetKcal &&
          other.proteinG == this.proteinG &&
          other.carbsG == this.carbsG &&
          other.fatG == this.fatG &&
          other.bmrKcal == this.bmrKcal &&
          other.tdeeKcal == this.tdeeKcal &&
          other.goalAdjustmentKcal == this.goalAdjustmentKcal &&
          other.activityFactor == this.activityFactor &&
          other.pace == this.pace &&
          other.formulaVersion == this.formulaVersion &&
          other.dateGenerated == this.dateGenerated &&
          other.floorKcal == this.floorKcal);
}

class DailyTargetsCompanion extends UpdateCompanion<DailyTargetsRow> {
  final Value<int> id;
  final Value<int> targetKcal;
  final Value<int> proteinG;
  final Value<int> carbsG;
  final Value<int> fatG;
  final Value<double> bmrKcal;
  final Value<double> tdeeKcal;
  final Value<double> goalAdjustmentKcal;
  final Value<double> activityFactor;
  final Value<String?> pace;
  final Value<String> formulaVersion;
  final Value<DateTime> dateGenerated;
  final Value<int> floorKcal;
  const DailyTargetsCompanion({
    this.id = const Value.absent(),
    this.targetKcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.fatG = const Value.absent(),
    this.bmrKcal = const Value.absent(),
    this.tdeeKcal = const Value.absent(),
    this.goalAdjustmentKcal = const Value.absent(),
    this.activityFactor = const Value.absent(),
    this.pace = const Value.absent(),
    this.formulaVersion = const Value.absent(),
    this.dateGenerated = const Value.absent(),
    this.floorKcal = const Value.absent(),
  });
  DailyTargetsCompanion.insert({
    this.id = const Value.absent(),
    required int targetKcal,
    required int proteinG,
    required int carbsG,
    required int fatG,
    required double bmrKcal,
    required double tdeeKcal,
    required double goalAdjustmentKcal,
    required double activityFactor,
    this.pace = const Value.absent(),
    required String formulaVersion,
    required DateTime dateGenerated,
    required int floorKcal,
  }) : targetKcal = Value(targetKcal),
       proteinG = Value(proteinG),
       carbsG = Value(carbsG),
       fatG = Value(fatG),
       bmrKcal = Value(bmrKcal),
       tdeeKcal = Value(tdeeKcal),
       goalAdjustmentKcal = Value(goalAdjustmentKcal),
       activityFactor = Value(activityFactor),
       formulaVersion = Value(formulaVersion),
       dateGenerated = Value(dateGenerated),
       floorKcal = Value(floorKcal);
  static Insertable<DailyTargetsRow> custom({
    Expression<int>? id,
    Expression<int>? targetKcal,
    Expression<int>? proteinG,
    Expression<int>? carbsG,
    Expression<int>? fatG,
    Expression<double>? bmrKcal,
    Expression<double>? tdeeKcal,
    Expression<double>? goalAdjustmentKcal,
    Expression<double>? activityFactor,
    Expression<String>? pace,
    Expression<String>? formulaVersion,
    Expression<DateTime>? dateGenerated,
    Expression<int>? floorKcal,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (targetKcal != null) 'target_kcal': targetKcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (fatG != null) 'fat_g': fatG,
      if (bmrKcal != null) 'bmr_kcal': bmrKcal,
      if (tdeeKcal != null) 'tdee_kcal': tdeeKcal,
      if (goalAdjustmentKcal != null)
        'goal_adjustment_kcal': goalAdjustmentKcal,
      if (activityFactor != null) 'activity_factor': activityFactor,
      if (pace != null) 'pace': pace,
      if (formulaVersion != null) 'formula_version': formulaVersion,
      if (dateGenerated != null) 'date_generated': dateGenerated,
      if (floorKcal != null) 'floor_kcal': floorKcal,
    });
  }

  DailyTargetsCompanion copyWith({
    Value<int>? id,
    Value<int>? targetKcal,
    Value<int>? proteinG,
    Value<int>? carbsG,
    Value<int>? fatG,
    Value<double>? bmrKcal,
    Value<double>? tdeeKcal,
    Value<double>? goalAdjustmentKcal,
    Value<double>? activityFactor,
    Value<String?>? pace,
    Value<String>? formulaVersion,
    Value<DateTime>? dateGenerated,
    Value<int>? floorKcal,
  }) {
    return DailyTargetsCompanion(
      id: id ?? this.id,
      targetKcal: targetKcal ?? this.targetKcal,
      proteinG: proteinG ?? this.proteinG,
      carbsG: carbsG ?? this.carbsG,
      fatG: fatG ?? this.fatG,
      bmrKcal: bmrKcal ?? this.bmrKcal,
      tdeeKcal: tdeeKcal ?? this.tdeeKcal,
      goalAdjustmentKcal: goalAdjustmentKcal ?? this.goalAdjustmentKcal,
      activityFactor: activityFactor ?? this.activityFactor,
      pace: pace ?? this.pace,
      formulaVersion: formulaVersion ?? this.formulaVersion,
      dateGenerated: dateGenerated ?? this.dateGenerated,
      floorKcal: floorKcal ?? this.floorKcal,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (targetKcal.present) {
      map['target_kcal'] = Variable<int>(targetKcal.value);
    }
    if (proteinG.present) {
      map['protein_g'] = Variable<int>(proteinG.value);
    }
    if (carbsG.present) {
      map['carbs_g'] = Variable<int>(carbsG.value);
    }
    if (fatG.present) {
      map['fat_g'] = Variable<int>(fatG.value);
    }
    if (bmrKcal.present) {
      map['bmr_kcal'] = Variable<double>(bmrKcal.value);
    }
    if (tdeeKcal.present) {
      map['tdee_kcal'] = Variable<double>(tdeeKcal.value);
    }
    if (goalAdjustmentKcal.present) {
      map['goal_adjustment_kcal'] = Variable<double>(goalAdjustmentKcal.value);
    }
    if (activityFactor.present) {
      map['activity_factor'] = Variable<double>(activityFactor.value);
    }
    if (pace.present) {
      map['pace'] = Variable<String>(pace.value);
    }
    if (formulaVersion.present) {
      map['formula_version'] = Variable<String>(formulaVersion.value);
    }
    if (dateGenerated.present) {
      map['date_generated'] = Variable<DateTime>(dateGenerated.value);
    }
    if (floorKcal.present) {
      map['floor_kcal'] = Variable<int>(floorKcal.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DailyTargetsCompanion(')
          ..write('id: $id, ')
          ..write('targetKcal: $targetKcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('bmrKcal: $bmrKcal, ')
          ..write('tdeeKcal: $tdeeKcal, ')
          ..write('goalAdjustmentKcal: $goalAdjustmentKcal, ')
          ..write('activityFactor: $activityFactor, ')
          ..write('pace: $pace, ')
          ..write('formulaVersion: $formulaVersion, ')
          ..write('dateGenerated: $dateGenerated, ')
          ..write('floorKcal: $floorKcal')
          ..write(')'))
        .toString();
  }
}

class $MealsTable extends Meals with TableInfo<$MealsTable, MealsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MealsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _dateKeyMeta = const VerificationMeta(
    'dateKey',
  );
  @override
  late final GeneratedColumn<String> dateKey = GeneratedColumn<String>(
    'date_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _slotMeta = const VerificationMeta('slot');
  @override
  late final GeneratedColumn<String> slot = GeneratedColumn<String>(
    'slot',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, dateKey, slot, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'meals';
  @override
  VerificationContext validateIntegrity(
    Insertable<MealsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('date_key')) {
      context.handle(
        _dateKeyMeta,
        dateKey.isAcceptableOrUnknown(data['date_key']!, _dateKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_dateKeyMeta);
    }
    if (data.containsKey('slot')) {
      context.handle(
        _slotMeta,
        slot.isAcceptableOrUnknown(data['slot']!, _slotMeta),
      );
    } else if (isInserting) {
      context.missing(_slotMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MealsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MealsRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      dateKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}date_key'],
      )!,
      slot: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}slot'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $MealsTable createAlias(String alias) {
    return $MealsTable(attachedDatabase, alias);
  }
}

class MealsRow extends DataClass implements Insertable<MealsRow> {
  final int id;

  /// Local calendar day as `yyyy-MM-dd`.
  final String dateKey;

  /// `MealSlot.name`.
  final String slot;
  final DateTime createdAt;
  const MealsRow({
    required this.id,
    required this.dateKey,
    required this.slot,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['date_key'] = Variable<String>(dateKey);
    map['slot'] = Variable<String>(slot);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  MealsCompanion toCompanion(bool nullToAbsent) {
    return MealsCompanion(
      id: Value(id),
      dateKey: Value(dateKey),
      slot: Value(slot),
      createdAt: Value(createdAt),
    );
  }

  factory MealsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MealsRow(
      id: serializer.fromJson<int>(json['id']),
      dateKey: serializer.fromJson<String>(json['dateKey']),
      slot: serializer.fromJson<String>(json['slot']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'dateKey': serializer.toJson<String>(dateKey),
      'slot': serializer.toJson<String>(slot),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  MealsRow copyWith({
    int? id,
    String? dateKey,
    String? slot,
    DateTime? createdAt,
  }) => MealsRow(
    id: id ?? this.id,
    dateKey: dateKey ?? this.dateKey,
    slot: slot ?? this.slot,
    createdAt: createdAt ?? this.createdAt,
  );
  MealsRow copyWithCompanion(MealsCompanion data) {
    return MealsRow(
      id: data.id.present ? data.id.value : this.id,
      dateKey: data.dateKey.present ? data.dateKey.value : this.dateKey,
      slot: data.slot.present ? data.slot.value : this.slot,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MealsRow(')
          ..write('id: $id, ')
          ..write('dateKey: $dateKey, ')
          ..write('slot: $slot, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, dateKey, slot, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MealsRow &&
          other.id == this.id &&
          other.dateKey == this.dateKey &&
          other.slot == this.slot &&
          other.createdAt == this.createdAt);
}

class MealsCompanion extends UpdateCompanion<MealsRow> {
  final Value<int> id;
  final Value<String> dateKey;
  final Value<String> slot;
  final Value<DateTime> createdAt;
  const MealsCompanion({
    this.id = const Value.absent(),
    this.dateKey = const Value.absent(),
    this.slot = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  MealsCompanion.insert({
    this.id = const Value.absent(),
    required String dateKey,
    required String slot,
    required DateTime createdAt,
  }) : dateKey = Value(dateKey),
       slot = Value(slot),
       createdAt = Value(createdAt);
  static Insertable<MealsRow> custom({
    Expression<int>? id,
    Expression<String>? dateKey,
    Expression<String>? slot,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (dateKey != null) 'date_key': dateKey,
      if (slot != null) 'slot': slot,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  MealsCompanion copyWith({
    Value<int>? id,
    Value<String>? dateKey,
    Value<String>? slot,
    Value<DateTime>? createdAt,
  }) {
    return MealsCompanion(
      id: id ?? this.id,
      dateKey: dateKey ?? this.dateKey,
      slot: slot ?? this.slot,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (dateKey.present) {
      map['date_key'] = Variable<String>(dateKey.value);
    }
    if (slot.present) {
      map['slot'] = Variable<String>(slot.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MealsCompanion(')
          ..write('id: $id, ')
          ..write('dateKey: $dateKey, ')
          ..write('slot: $slot, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $MealItemsTable extends MealItems
    with TableInfo<$MealItemsTable, MealItemsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MealItemsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _mealIdMeta = const VerificationMeta('mealId');
  @override
  late final GeneratedColumn<int> mealId = GeneratedColumn<int>(
    'meal_id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES meals (id)',
    ),
  );
  static const VerificationMeta _foodIdMeta = const VerificationMeta('foodId');
  @override
  late final GeneratedColumn<String> foodId = GeneratedColumn<String>(
    'food_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _foodNameMeta = const VerificationMeta(
    'foodName',
  );
  @override
  late final GeneratedColumn<String> foodName = GeneratedColumn<String>(
    'food_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _portionUnitMeta = const VerificationMeta(
    'portionUnit',
  );
  @override
  late final GeneratedColumn<String> portionUnit = GeneratedColumn<String>(
    'portion_unit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _portionQuantityMeta = const VerificationMeta(
    'portionQuantity',
  );
  @override
  late final GeneratedColumn<double> portionQuantity = GeneratedColumn<double>(
    'portion_quantity',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _gramsMeta = const VerificationMeta('grams');
  @override
  late final GeneratedColumn<double> grams = GeneratedColumn<double>(
    'grams',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _kcalMeta = const VerificationMeta('kcal');
  @override
  late final GeneratedColumn<double> kcal = GeneratedColumn<double>(
    'kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinGMeta = const VerificationMeta(
    'proteinG',
  );
  @override
  late final GeneratedColumn<double> proteinG = GeneratedColumn<double>(
    'protein_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _carbsGMeta = const VerificationMeta('carbsG');
  @override
  late final GeneratedColumn<double> carbsG = GeneratedColumn<double>(
    'carbs_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fatGMeta = const VerificationMeta('fatG');
  @override
  late final GeneratedColumn<double> fatG = GeneratedColumn<double>(
    'fat_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fiberGMeta = const VerificationMeta('fiberG');
  @override
  late final GeneratedColumn<double> fiberG = GeneratedColumn<double>(
    'fiber_g',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sodiumMgMeta = const VerificationMeta(
    'sodiumMg',
  );
  @override
  late final GeneratedColumn<double> sodiumMg = GeneratedColumn<double>(
    'sodium_mg',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    mealId,
    foodId,
    foodName,
    portionUnit,
    portionQuantity,
    grams,
    kcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sodiumMg,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'meal_items';
  @override
  VerificationContext validateIntegrity(
    Insertable<MealItemsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('meal_id')) {
      context.handle(
        _mealIdMeta,
        mealId.isAcceptableOrUnknown(data['meal_id']!, _mealIdMeta),
      );
    } else if (isInserting) {
      context.missing(_mealIdMeta);
    }
    if (data.containsKey('food_id')) {
      context.handle(
        _foodIdMeta,
        foodId.isAcceptableOrUnknown(data['food_id']!, _foodIdMeta),
      );
    } else if (isInserting) {
      context.missing(_foodIdMeta);
    }
    if (data.containsKey('food_name')) {
      context.handle(
        _foodNameMeta,
        foodName.isAcceptableOrUnknown(data['food_name']!, _foodNameMeta),
      );
    } else if (isInserting) {
      context.missing(_foodNameMeta);
    }
    if (data.containsKey('portion_unit')) {
      context.handle(
        _portionUnitMeta,
        portionUnit.isAcceptableOrUnknown(
          data['portion_unit']!,
          _portionUnitMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_portionUnitMeta);
    }
    if (data.containsKey('portion_quantity')) {
      context.handle(
        _portionQuantityMeta,
        portionQuantity.isAcceptableOrUnknown(
          data['portion_quantity']!,
          _portionQuantityMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_portionQuantityMeta);
    }
    if (data.containsKey('grams')) {
      context.handle(
        _gramsMeta,
        grams.isAcceptableOrUnknown(data['grams']!, _gramsMeta),
      );
    } else if (isInserting) {
      context.missing(_gramsMeta);
    }
    if (data.containsKey('kcal')) {
      context.handle(
        _kcalMeta,
        kcal.isAcceptableOrUnknown(data['kcal']!, _kcalMeta),
      );
    } else if (isInserting) {
      context.missing(_kcalMeta);
    }
    if (data.containsKey('protein_g')) {
      context.handle(
        _proteinGMeta,
        proteinG.isAcceptableOrUnknown(data['protein_g']!, _proteinGMeta),
      );
    } else if (isInserting) {
      context.missing(_proteinGMeta);
    }
    if (data.containsKey('carbs_g')) {
      context.handle(
        _carbsGMeta,
        carbsG.isAcceptableOrUnknown(data['carbs_g']!, _carbsGMeta),
      );
    } else if (isInserting) {
      context.missing(_carbsGMeta);
    }
    if (data.containsKey('fat_g')) {
      context.handle(
        _fatGMeta,
        fatG.isAcceptableOrUnknown(data['fat_g']!, _fatGMeta),
      );
    } else if (isInserting) {
      context.missing(_fatGMeta);
    }
    if (data.containsKey('fiber_g')) {
      context.handle(
        _fiberGMeta,
        fiberG.isAcceptableOrUnknown(data['fiber_g']!, _fiberGMeta),
      );
    }
    if (data.containsKey('sodium_mg')) {
      context.handle(
        _sodiumMgMeta,
        sodiumMg.isAcceptableOrUnknown(data['sodium_mg']!, _sodiumMgMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MealItemsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MealItemsRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      mealId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}meal_id'],
      )!,
      foodId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}food_id'],
      )!,
      foodName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}food_name'],
      )!,
      portionUnit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}portion_unit'],
      )!,
      portionQuantity: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}portion_quantity'],
      )!,
      grams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}grams'],
      )!,
      kcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}kcal'],
      )!,
      proteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}protein_g'],
      )!,
      carbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}carbs_g'],
      )!,
      fatG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}fat_g'],
      )!,
      fiberG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}fiber_g'],
      ),
      sodiumMg: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}sodium_mg'],
      ),
    );
  }

  @override
  $MealItemsTable createAlias(String alias) {
    return $MealItemsTable(attachedDatabase, alias);
  }
}

class MealItemsRow extends DataClass implements Insertable<MealItemsRow> {
  final int id;
  final int mealId;
  final String foodId;

  /// Display name copied at log time.
  final String foodName;

  /// `PortionUnit.name`.
  final String portionUnit;
  final double portionQuantity;
  final double grams;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final double? sodiumMg;
  const MealItemsRow({
    required this.id,
    required this.mealId,
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
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['meal_id'] = Variable<int>(mealId);
    map['food_id'] = Variable<String>(foodId);
    map['food_name'] = Variable<String>(foodName);
    map['portion_unit'] = Variable<String>(portionUnit);
    map['portion_quantity'] = Variable<double>(portionQuantity);
    map['grams'] = Variable<double>(grams);
    map['kcal'] = Variable<double>(kcal);
    map['protein_g'] = Variable<double>(proteinG);
    map['carbs_g'] = Variable<double>(carbsG);
    map['fat_g'] = Variable<double>(fatG);
    if (!nullToAbsent || fiberG != null) {
      map['fiber_g'] = Variable<double>(fiberG);
    }
    if (!nullToAbsent || sodiumMg != null) {
      map['sodium_mg'] = Variable<double>(sodiumMg);
    }
    return map;
  }

  MealItemsCompanion toCompanion(bool nullToAbsent) {
    return MealItemsCompanion(
      id: Value(id),
      mealId: Value(mealId),
      foodId: Value(foodId),
      foodName: Value(foodName),
      portionUnit: Value(portionUnit),
      portionQuantity: Value(portionQuantity),
      grams: Value(grams),
      kcal: Value(kcal),
      proteinG: Value(proteinG),
      carbsG: Value(carbsG),
      fatG: Value(fatG),
      fiberG: fiberG == null && nullToAbsent
          ? const Value.absent()
          : Value(fiberG),
      sodiumMg: sodiumMg == null && nullToAbsent
          ? const Value.absent()
          : Value(sodiumMg),
    );
  }

  factory MealItemsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MealItemsRow(
      id: serializer.fromJson<int>(json['id']),
      mealId: serializer.fromJson<int>(json['mealId']),
      foodId: serializer.fromJson<String>(json['foodId']),
      foodName: serializer.fromJson<String>(json['foodName']),
      portionUnit: serializer.fromJson<String>(json['portionUnit']),
      portionQuantity: serializer.fromJson<double>(json['portionQuantity']),
      grams: serializer.fromJson<double>(json['grams']),
      kcal: serializer.fromJson<double>(json['kcal']),
      proteinG: serializer.fromJson<double>(json['proteinG']),
      carbsG: serializer.fromJson<double>(json['carbsG']),
      fatG: serializer.fromJson<double>(json['fatG']),
      fiberG: serializer.fromJson<double?>(json['fiberG']),
      sodiumMg: serializer.fromJson<double?>(json['sodiumMg']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'mealId': serializer.toJson<int>(mealId),
      'foodId': serializer.toJson<String>(foodId),
      'foodName': serializer.toJson<String>(foodName),
      'portionUnit': serializer.toJson<String>(portionUnit),
      'portionQuantity': serializer.toJson<double>(portionQuantity),
      'grams': serializer.toJson<double>(grams),
      'kcal': serializer.toJson<double>(kcal),
      'proteinG': serializer.toJson<double>(proteinG),
      'carbsG': serializer.toJson<double>(carbsG),
      'fatG': serializer.toJson<double>(fatG),
      'fiberG': serializer.toJson<double?>(fiberG),
      'sodiumMg': serializer.toJson<double?>(sodiumMg),
    };
  }

  MealItemsRow copyWith({
    int? id,
    int? mealId,
    String? foodId,
    String? foodName,
    String? portionUnit,
    double? portionQuantity,
    double? grams,
    double? kcal,
    double? proteinG,
    double? carbsG,
    double? fatG,
    Value<double?> fiberG = const Value.absent(),
    Value<double?> sodiumMg = const Value.absent(),
  }) => MealItemsRow(
    id: id ?? this.id,
    mealId: mealId ?? this.mealId,
    foodId: foodId ?? this.foodId,
    foodName: foodName ?? this.foodName,
    portionUnit: portionUnit ?? this.portionUnit,
    portionQuantity: portionQuantity ?? this.portionQuantity,
    grams: grams ?? this.grams,
    kcal: kcal ?? this.kcal,
    proteinG: proteinG ?? this.proteinG,
    carbsG: carbsG ?? this.carbsG,
    fatG: fatG ?? this.fatG,
    fiberG: fiberG.present ? fiberG.value : this.fiberG,
    sodiumMg: sodiumMg.present ? sodiumMg.value : this.sodiumMg,
  );
  MealItemsRow copyWithCompanion(MealItemsCompanion data) {
    return MealItemsRow(
      id: data.id.present ? data.id.value : this.id,
      mealId: data.mealId.present ? data.mealId.value : this.mealId,
      foodId: data.foodId.present ? data.foodId.value : this.foodId,
      foodName: data.foodName.present ? data.foodName.value : this.foodName,
      portionUnit: data.portionUnit.present
          ? data.portionUnit.value
          : this.portionUnit,
      portionQuantity: data.portionQuantity.present
          ? data.portionQuantity.value
          : this.portionQuantity,
      grams: data.grams.present ? data.grams.value : this.grams,
      kcal: data.kcal.present ? data.kcal.value : this.kcal,
      proteinG: data.proteinG.present ? data.proteinG.value : this.proteinG,
      carbsG: data.carbsG.present ? data.carbsG.value : this.carbsG,
      fatG: data.fatG.present ? data.fatG.value : this.fatG,
      fiberG: data.fiberG.present ? data.fiberG.value : this.fiberG,
      sodiumMg: data.sodiumMg.present ? data.sodiumMg.value : this.sodiumMg,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MealItemsRow(')
          ..write('id: $id, ')
          ..write('mealId: $mealId, ')
          ..write('foodId: $foodId, ')
          ..write('foodName: $foodName, ')
          ..write('portionUnit: $portionUnit, ')
          ..write('portionQuantity: $portionQuantity, ')
          ..write('grams: $grams, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('fiberG: $fiberG, ')
          ..write('sodiumMg: $sodiumMg')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    mealId,
    foodId,
    foodName,
    portionUnit,
    portionQuantity,
    grams,
    kcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sodiumMg,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MealItemsRow &&
          other.id == this.id &&
          other.mealId == this.mealId &&
          other.foodId == this.foodId &&
          other.foodName == this.foodName &&
          other.portionUnit == this.portionUnit &&
          other.portionQuantity == this.portionQuantity &&
          other.grams == this.grams &&
          other.kcal == this.kcal &&
          other.proteinG == this.proteinG &&
          other.carbsG == this.carbsG &&
          other.fatG == this.fatG &&
          other.fiberG == this.fiberG &&
          other.sodiumMg == this.sodiumMg);
}

class MealItemsCompanion extends UpdateCompanion<MealItemsRow> {
  final Value<int> id;
  final Value<int> mealId;
  final Value<String> foodId;
  final Value<String> foodName;
  final Value<String> portionUnit;
  final Value<double> portionQuantity;
  final Value<double> grams;
  final Value<double> kcal;
  final Value<double> proteinG;
  final Value<double> carbsG;
  final Value<double> fatG;
  final Value<double?> fiberG;
  final Value<double?> sodiumMg;
  const MealItemsCompanion({
    this.id = const Value.absent(),
    this.mealId = const Value.absent(),
    this.foodId = const Value.absent(),
    this.foodName = const Value.absent(),
    this.portionUnit = const Value.absent(),
    this.portionQuantity = const Value.absent(),
    this.grams = const Value.absent(),
    this.kcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.fatG = const Value.absent(),
    this.fiberG = const Value.absent(),
    this.sodiumMg = const Value.absent(),
  });
  MealItemsCompanion.insert({
    this.id = const Value.absent(),
    required int mealId,
    required String foodId,
    required String foodName,
    required String portionUnit,
    required double portionQuantity,
    required double grams,
    required double kcal,
    required double proteinG,
    required double carbsG,
    required double fatG,
    this.fiberG = const Value.absent(),
    this.sodiumMg = const Value.absent(),
  }) : mealId = Value(mealId),
       foodId = Value(foodId),
       foodName = Value(foodName),
       portionUnit = Value(portionUnit),
       portionQuantity = Value(portionQuantity),
       grams = Value(grams),
       kcal = Value(kcal),
       proteinG = Value(proteinG),
       carbsG = Value(carbsG),
       fatG = Value(fatG);
  static Insertable<MealItemsRow> custom({
    Expression<int>? id,
    Expression<int>? mealId,
    Expression<String>? foodId,
    Expression<String>? foodName,
    Expression<String>? portionUnit,
    Expression<double>? portionQuantity,
    Expression<double>? grams,
    Expression<double>? kcal,
    Expression<double>? proteinG,
    Expression<double>? carbsG,
    Expression<double>? fatG,
    Expression<double>? fiberG,
    Expression<double>? sodiumMg,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (mealId != null) 'meal_id': mealId,
      if (foodId != null) 'food_id': foodId,
      if (foodName != null) 'food_name': foodName,
      if (portionUnit != null) 'portion_unit': portionUnit,
      if (portionQuantity != null) 'portion_quantity': portionQuantity,
      if (grams != null) 'grams': grams,
      if (kcal != null) 'kcal': kcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (fatG != null) 'fat_g': fatG,
      if (fiberG != null) 'fiber_g': fiberG,
      if (sodiumMg != null) 'sodium_mg': sodiumMg,
    });
  }

  MealItemsCompanion copyWith({
    Value<int>? id,
    Value<int>? mealId,
    Value<String>? foodId,
    Value<String>? foodName,
    Value<String>? portionUnit,
    Value<double>? portionQuantity,
    Value<double>? grams,
    Value<double>? kcal,
    Value<double>? proteinG,
    Value<double>? carbsG,
    Value<double>? fatG,
    Value<double?>? fiberG,
    Value<double?>? sodiumMg,
  }) {
    return MealItemsCompanion(
      id: id ?? this.id,
      mealId: mealId ?? this.mealId,
      foodId: foodId ?? this.foodId,
      foodName: foodName ?? this.foodName,
      portionUnit: portionUnit ?? this.portionUnit,
      portionQuantity: portionQuantity ?? this.portionQuantity,
      grams: grams ?? this.grams,
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      carbsG: carbsG ?? this.carbsG,
      fatG: fatG ?? this.fatG,
      fiberG: fiberG ?? this.fiberG,
      sodiumMg: sodiumMg ?? this.sodiumMg,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (mealId.present) {
      map['meal_id'] = Variable<int>(mealId.value);
    }
    if (foodId.present) {
      map['food_id'] = Variable<String>(foodId.value);
    }
    if (foodName.present) {
      map['food_name'] = Variable<String>(foodName.value);
    }
    if (portionUnit.present) {
      map['portion_unit'] = Variable<String>(portionUnit.value);
    }
    if (portionQuantity.present) {
      map['portion_quantity'] = Variable<double>(portionQuantity.value);
    }
    if (grams.present) {
      map['grams'] = Variable<double>(grams.value);
    }
    if (kcal.present) {
      map['kcal'] = Variable<double>(kcal.value);
    }
    if (proteinG.present) {
      map['protein_g'] = Variable<double>(proteinG.value);
    }
    if (carbsG.present) {
      map['carbs_g'] = Variable<double>(carbsG.value);
    }
    if (fatG.present) {
      map['fat_g'] = Variable<double>(fatG.value);
    }
    if (fiberG.present) {
      map['fiber_g'] = Variable<double>(fiberG.value);
    }
    if (sodiumMg.present) {
      map['sodium_mg'] = Variable<double>(sodiumMg.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MealItemsCompanion(')
          ..write('id: $id, ')
          ..write('mealId: $mealId, ')
          ..write('foodId: $foodId, ')
          ..write('foodName: $foodName, ')
          ..write('portionUnit: $portionUnit, ')
          ..write('portionQuantity: $portionQuantity, ')
          ..write('grams: $grams, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('fiberG: $fiberG, ')
          ..write('sodiumMg: $sodiumMg')
          ..write(')'))
        .toString();
  }
}

class $WaterLogsTable extends WaterLogs
    with TableInfo<$WaterLogsTable, WaterLogsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WaterLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _dateKeyMeta = const VerificationMeta(
    'dateKey',
  );
  @override
  late final GeneratedColumn<String> dateKey = GeneratedColumn<String>(
    'date_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _amountMlMeta = const VerificationMeta(
    'amountMl',
  );
  @override
  late final GeneratedColumn<int> amountMl = GeneratedColumn<int>(
    'amount_ml',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _loggedAtMeta = const VerificationMeta(
    'loggedAt',
  );
  @override
  late final GeneratedColumn<DateTime> loggedAt = GeneratedColumn<DateTime>(
    'logged_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, dateKey, amountMl, loggedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'water_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<WaterLogsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('date_key')) {
      context.handle(
        _dateKeyMeta,
        dateKey.isAcceptableOrUnknown(data['date_key']!, _dateKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_dateKeyMeta);
    }
    if (data.containsKey('amount_ml')) {
      context.handle(
        _amountMlMeta,
        amountMl.isAcceptableOrUnknown(data['amount_ml']!, _amountMlMeta),
      );
    } else if (isInserting) {
      context.missing(_amountMlMeta);
    }
    if (data.containsKey('logged_at')) {
      context.handle(
        _loggedAtMeta,
        loggedAt.isAcceptableOrUnknown(data['logged_at']!, _loggedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_loggedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  WaterLogsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WaterLogsRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      dateKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}date_key'],
      )!,
      amountMl: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}amount_ml'],
      )!,
      loggedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}logged_at'],
      )!,
    );
  }

  @override
  $WaterLogsTable createAlias(String alias) {
    return $WaterLogsTable(attachedDatabase, alias);
  }
}

class WaterLogsRow extends DataClass implements Insertable<WaterLogsRow> {
  final int id;

  /// Local calendar day as `yyyy-MM-dd`.
  final String dateKey;
  final int amountMl;
  final DateTime loggedAt;
  const WaterLogsRow({
    required this.id,
    required this.dateKey,
    required this.amountMl,
    required this.loggedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['date_key'] = Variable<String>(dateKey);
    map['amount_ml'] = Variable<int>(amountMl);
    map['logged_at'] = Variable<DateTime>(loggedAt);
    return map;
  }

  WaterLogsCompanion toCompanion(bool nullToAbsent) {
    return WaterLogsCompanion(
      id: Value(id),
      dateKey: Value(dateKey),
      amountMl: Value(amountMl),
      loggedAt: Value(loggedAt),
    );
  }

  factory WaterLogsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WaterLogsRow(
      id: serializer.fromJson<int>(json['id']),
      dateKey: serializer.fromJson<String>(json['dateKey']),
      amountMl: serializer.fromJson<int>(json['amountMl']),
      loggedAt: serializer.fromJson<DateTime>(json['loggedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'dateKey': serializer.toJson<String>(dateKey),
      'amountMl': serializer.toJson<int>(amountMl),
      'loggedAt': serializer.toJson<DateTime>(loggedAt),
    };
  }

  WaterLogsRow copyWith({
    int? id,
    String? dateKey,
    int? amountMl,
    DateTime? loggedAt,
  }) => WaterLogsRow(
    id: id ?? this.id,
    dateKey: dateKey ?? this.dateKey,
    amountMl: amountMl ?? this.amountMl,
    loggedAt: loggedAt ?? this.loggedAt,
  );
  WaterLogsRow copyWithCompanion(WaterLogsCompanion data) {
    return WaterLogsRow(
      id: data.id.present ? data.id.value : this.id,
      dateKey: data.dateKey.present ? data.dateKey.value : this.dateKey,
      amountMl: data.amountMl.present ? data.amountMl.value : this.amountMl,
      loggedAt: data.loggedAt.present ? data.loggedAt.value : this.loggedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WaterLogsRow(')
          ..write('id: $id, ')
          ..write('dateKey: $dateKey, ')
          ..write('amountMl: $amountMl, ')
          ..write('loggedAt: $loggedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, dateKey, amountMl, loggedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WaterLogsRow &&
          other.id == this.id &&
          other.dateKey == this.dateKey &&
          other.amountMl == this.amountMl &&
          other.loggedAt == this.loggedAt);
}

class WaterLogsCompanion extends UpdateCompanion<WaterLogsRow> {
  final Value<int> id;
  final Value<String> dateKey;
  final Value<int> amountMl;
  final Value<DateTime> loggedAt;
  const WaterLogsCompanion({
    this.id = const Value.absent(),
    this.dateKey = const Value.absent(),
    this.amountMl = const Value.absent(),
    this.loggedAt = const Value.absent(),
  });
  WaterLogsCompanion.insert({
    this.id = const Value.absent(),
    required String dateKey,
    required int amountMl,
    required DateTime loggedAt,
  }) : dateKey = Value(dateKey),
       amountMl = Value(amountMl),
       loggedAt = Value(loggedAt);
  static Insertable<WaterLogsRow> custom({
    Expression<int>? id,
    Expression<String>? dateKey,
    Expression<int>? amountMl,
    Expression<DateTime>? loggedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (dateKey != null) 'date_key': dateKey,
      if (amountMl != null) 'amount_ml': amountMl,
      if (loggedAt != null) 'logged_at': loggedAt,
    });
  }

  WaterLogsCompanion copyWith({
    Value<int>? id,
    Value<String>? dateKey,
    Value<int>? amountMl,
    Value<DateTime>? loggedAt,
  }) {
    return WaterLogsCompanion(
      id: id ?? this.id,
      dateKey: dateKey ?? this.dateKey,
      amountMl: amountMl ?? this.amountMl,
      loggedAt: loggedAt ?? this.loggedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (dateKey.present) {
      map['date_key'] = Variable<String>(dateKey.value);
    }
    if (amountMl.present) {
      map['amount_ml'] = Variable<int>(amountMl.value);
    }
    if (loggedAt.present) {
      map['logged_at'] = Variable<DateTime>(loggedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WaterLogsCompanion(')
          ..write('id: $id, ')
          ..write('dateKey: $dateKey, ')
          ..write('amountMl: $amountMl, ')
          ..write('loggedAt: $loggedAt')
          ..write(')'))
        .toString();
  }
}

class $WeightLogsTable extends WeightLogs
    with TableInfo<$WeightLogsTable, WeightLogsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WeightLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _dateKeyMeta = const VerificationMeta(
    'dateKey',
  );
  @override
  late final GeneratedColumn<String> dateKey = GeneratedColumn<String>(
    'date_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _weightKgMeta = const VerificationMeta(
    'weightKg',
  );
  @override
  late final GeneratedColumn<double> weightKg = GeneratedColumn<double>(
    'weight_kg',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _loggedAtMeta = const VerificationMeta(
    'loggedAt',
  );
  @override
  late final GeneratedColumn<DateTime> loggedAt = GeneratedColumn<DateTime>(
    'logged_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, dateKey, weightKg, loggedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'weight_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<WeightLogsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('date_key')) {
      context.handle(
        _dateKeyMeta,
        dateKey.isAcceptableOrUnknown(data['date_key']!, _dateKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_dateKeyMeta);
    }
    if (data.containsKey('weight_kg')) {
      context.handle(
        _weightKgMeta,
        weightKg.isAcceptableOrUnknown(data['weight_kg']!, _weightKgMeta),
      );
    } else if (isInserting) {
      context.missing(_weightKgMeta);
    }
    if (data.containsKey('logged_at')) {
      context.handle(
        _loggedAtMeta,
        loggedAt.isAcceptableOrUnknown(data['logged_at']!, _loggedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_loggedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  WeightLogsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WeightLogsRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      dateKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}date_key'],
      )!,
      weightKg: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}weight_kg'],
      )!,
      loggedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}logged_at'],
      )!,
    );
  }

  @override
  $WeightLogsTable createAlias(String alias) {
    return $WeightLogsTable(attachedDatabase, alias);
  }
}

class WeightLogsRow extends DataClass implements Insertable<WeightLogsRow> {
  final int id;

  /// Local calendar day as `yyyy-MM-dd` — the day the entry is *for*, which may
  /// be earlier than the day it was recorded.
  final String dateKey;

  /// Kilograms, checked against the SAFE-01 body range before it is written.
  final double weightKg;
  final DateTime loggedAt;
  const WeightLogsRow({
    required this.id,
    required this.dateKey,
    required this.weightKg,
    required this.loggedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['date_key'] = Variable<String>(dateKey);
    map['weight_kg'] = Variable<double>(weightKg);
    map['logged_at'] = Variable<DateTime>(loggedAt);
    return map;
  }

  WeightLogsCompanion toCompanion(bool nullToAbsent) {
    return WeightLogsCompanion(
      id: Value(id),
      dateKey: Value(dateKey),
      weightKg: Value(weightKg),
      loggedAt: Value(loggedAt),
    );
  }

  factory WeightLogsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WeightLogsRow(
      id: serializer.fromJson<int>(json['id']),
      dateKey: serializer.fromJson<String>(json['dateKey']),
      weightKg: serializer.fromJson<double>(json['weightKg']),
      loggedAt: serializer.fromJson<DateTime>(json['loggedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'dateKey': serializer.toJson<String>(dateKey),
      'weightKg': serializer.toJson<double>(weightKg),
      'loggedAt': serializer.toJson<DateTime>(loggedAt),
    };
  }

  WeightLogsRow copyWith({
    int? id,
    String? dateKey,
    double? weightKg,
    DateTime? loggedAt,
  }) => WeightLogsRow(
    id: id ?? this.id,
    dateKey: dateKey ?? this.dateKey,
    weightKg: weightKg ?? this.weightKg,
    loggedAt: loggedAt ?? this.loggedAt,
  );
  WeightLogsRow copyWithCompanion(WeightLogsCompanion data) {
    return WeightLogsRow(
      id: data.id.present ? data.id.value : this.id,
      dateKey: data.dateKey.present ? data.dateKey.value : this.dateKey,
      weightKg: data.weightKg.present ? data.weightKg.value : this.weightKg,
      loggedAt: data.loggedAt.present ? data.loggedAt.value : this.loggedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WeightLogsRow(')
          ..write('id: $id, ')
          ..write('dateKey: $dateKey, ')
          ..write('weightKg: $weightKg, ')
          ..write('loggedAt: $loggedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, dateKey, weightKg, loggedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WeightLogsRow &&
          other.id == this.id &&
          other.dateKey == this.dateKey &&
          other.weightKg == this.weightKg &&
          other.loggedAt == this.loggedAt);
}

class WeightLogsCompanion extends UpdateCompanion<WeightLogsRow> {
  final Value<int> id;
  final Value<String> dateKey;
  final Value<double> weightKg;
  final Value<DateTime> loggedAt;
  const WeightLogsCompanion({
    this.id = const Value.absent(),
    this.dateKey = const Value.absent(),
    this.weightKg = const Value.absent(),
    this.loggedAt = const Value.absent(),
  });
  WeightLogsCompanion.insert({
    this.id = const Value.absent(),
    required String dateKey,
    required double weightKg,
    required DateTime loggedAt,
  }) : dateKey = Value(dateKey),
       weightKg = Value(weightKg),
       loggedAt = Value(loggedAt);
  static Insertable<WeightLogsRow> custom({
    Expression<int>? id,
    Expression<String>? dateKey,
    Expression<double>? weightKg,
    Expression<DateTime>? loggedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (dateKey != null) 'date_key': dateKey,
      if (weightKg != null) 'weight_kg': weightKg,
      if (loggedAt != null) 'logged_at': loggedAt,
    });
  }

  WeightLogsCompanion copyWith({
    Value<int>? id,
    Value<String>? dateKey,
    Value<double>? weightKg,
    Value<DateTime>? loggedAt,
  }) {
    return WeightLogsCompanion(
      id: id ?? this.id,
      dateKey: dateKey ?? this.dateKey,
      weightKg: weightKg ?? this.weightKg,
      loggedAt: loggedAt ?? this.loggedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (dateKey.present) {
      map['date_key'] = Variable<String>(dateKey.value);
    }
    if (weightKg.present) {
      map['weight_kg'] = Variable<double>(weightKg.value);
    }
    if (loggedAt.present) {
      map['logged_at'] = Variable<DateTime>(loggedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WeightLogsCompanion(')
          ..write('id: $id, ')
          ..write('dateKey: $dateKey, ')
          ..write('weightKg: $weightKg, ')
          ..write('loggedAt: $loggedAt')
          ..write(')'))
        .toString();
  }
}

class $SeedMetaTable extends SeedMeta
    with TableInfo<$SeedMetaTable, SeedMetaRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SeedMetaTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'seed_meta';
  @override
  VerificationContext validateIntegrity(
    Insertable<SeedMetaRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  SeedMetaRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SeedMetaRow(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $SeedMetaTable createAlias(String alias) {
    return $SeedMetaTable(attachedDatabase, alias);
  }
}

class SeedMetaRow extends DataClass implements Insertable<SeedMetaRow> {
  final String key;
  final String value;
  const SeedMetaRow({required this.key, required this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    return map;
  }

  SeedMetaCompanion toCompanion(bool nullToAbsent) {
    return SeedMetaCompanion(key: Value(key), value: Value(value));
  }

  factory SeedMetaRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SeedMetaRow(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
    };
  }

  SeedMetaRow copyWith({String? key, String? value}) =>
      SeedMetaRow(key: key ?? this.key, value: value ?? this.value);
  SeedMetaRow copyWithCompanion(SeedMetaCompanion data) {
    return SeedMetaRow(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SeedMetaRow(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SeedMetaRow &&
          other.key == this.key &&
          other.value == this.value);
}

class SeedMetaCompanion extends UpdateCompanion<SeedMetaRow> {
  final Value<String> key;
  final Value<String> value;
  final Value<int> rowid;
  const SeedMetaCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SeedMetaCompanion.insert({
    required String key,
    required String value,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<SeedMetaRow> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SeedMetaCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<int>? rowid,
  }) {
    return SeedMetaCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SeedMetaCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $UserProfileTableTable userProfileTable = $UserProfileTableTable(
    this,
  );
  late final $FoodsTable foods = $FoodsTable(this);
  late final $FoodAliasesTable foodAliases = $FoodAliasesTable(this);
  late final $FoodPortionsTable foodPortions = $FoodPortionsTable(this);
  late final $DailyTargetsTable dailyTargets = $DailyTargetsTable(this);
  late final $MealsTable meals = $MealsTable(this);
  late final $MealItemsTable mealItems = $MealItemsTable(this);
  late final $WaterLogsTable waterLogs = $WaterLogsTable(this);
  late final $WeightLogsTable weightLogs = $WeightLogsTable(this);
  late final $SeedMetaTable seedMeta = $SeedMetaTable(this);
  late final ProfileDao profileDao = ProfileDao(this as AppDatabase);
  late final FoodDao foodDao = FoodDao(this as AppDatabase);
  late final MealDao mealDao = MealDao(this as AppDatabase);
  late final WaterDao waterDao = WaterDao(this as AppDatabase);
  late final WeightDao weightDao = WeightDao(this as AppDatabase);
  late final TargetDao targetDao = TargetDao(this as AppDatabase);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    userProfileTable,
    foods,
    foodAliases,
    foodPortions,
    dailyTargets,
    meals,
    mealItems,
    waterLogs,
    weightLogs,
    seedMeta,
  ];
}

typedef $$UserProfileTableTableCreateCompanionBuilder =
    UserProfileTableCompanion Function({
      Value<String> language,
      Value<String?> goal,
      Value<String?> sex,
      Value<int?> age,
      Value<double?> heightCm,
      Value<double?> currentWeightKg,
      Value<double?> targetWeightKg,
      Value<String?> activity,
      Value<String?> pace,
      Value<String?> foodPreference,
      Value<int?> waterTargetMl,
      Value<bool> onboardingComplete,
      Value<int> currentOnboardingStep,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$UserProfileTableTableUpdateCompanionBuilder =
    UserProfileTableCompanion Function({
      Value<String> language,
      Value<String?> goal,
      Value<String?> sex,
      Value<int?> age,
      Value<double?> heightCm,
      Value<double?> currentWeightKg,
      Value<double?> targetWeightKg,
      Value<String?> activity,
      Value<String?> pace,
      Value<String?> foodPreference,
      Value<int?> waterTargetMl,
      Value<bool> onboardingComplete,
      Value<int> currentOnboardingStep,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$UserProfileTableTableFilterComposer
    extends Composer<_$AppDatabase, $UserProfileTableTable> {
  $$UserProfileTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get goal => $composableBuilder(
    column: $table.goal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sex => $composableBuilder(
    column: $table.sex,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get age => $composableBuilder(
    column: $table.age,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get heightCm => $composableBuilder(
    column: $table.heightCm,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get currentWeightKg => $composableBuilder(
    column: $table.currentWeightKg,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get targetWeightKg => $composableBuilder(
    column: $table.targetWeightKg,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get activity => $composableBuilder(
    column: $table.activity,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pace => $composableBuilder(
    column: $table.pace,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get foodPreference => $composableBuilder(
    column: $table.foodPreference,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get waterTargetMl => $composableBuilder(
    column: $table.waterTargetMl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get onboardingComplete => $composableBuilder(
    column: $table.onboardingComplete,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get currentOnboardingStep => $composableBuilder(
    column: $table.currentOnboardingStep,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$UserProfileTableTableOrderingComposer
    extends Composer<_$AppDatabase, $UserProfileTableTable> {
  $$UserProfileTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get goal => $composableBuilder(
    column: $table.goal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sex => $composableBuilder(
    column: $table.sex,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get age => $composableBuilder(
    column: $table.age,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get heightCm => $composableBuilder(
    column: $table.heightCm,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get currentWeightKg => $composableBuilder(
    column: $table.currentWeightKg,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get targetWeightKg => $composableBuilder(
    column: $table.targetWeightKg,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get activity => $composableBuilder(
    column: $table.activity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pace => $composableBuilder(
    column: $table.pace,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get foodPreference => $composableBuilder(
    column: $table.foodPreference,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get waterTargetMl => $composableBuilder(
    column: $table.waterTargetMl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get onboardingComplete => $composableBuilder(
    column: $table.onboardingComplete,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get currentOnboardingStep => $composableBuilder(
    column: $table.currentOnboardingStep,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$UserProfileTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $UserProfileTableTable> {
  $$UserProfileTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get language =>
      $composableBuilder(column: $table.language, builder: (column) => column);

  GeneratedColumn<String> get goal =>
      $composableBuilder(column: $table.goal, builder: (column) => column);

  GeneratedColumn<String> get sex =>
      $composableBuilder(column: $table.sex, builder: (column) => column);

  GeneratedColumn<int> get age =>
      $composableBuilder(column: $table.age, builder: (column) => column);

  GeneratedColumn<double> get heightCm =>
      $composableBuilder(column: $table.heightCm, builder: (column) => column);

  GeneratedColumn<double> get currentWeightKg => $composableBuilder(
    column: $table.currentWeightKg,
    builder: (column) => column,
  );

  GeneratedColumn<double> get targetWeightKg => $composableBuilder(
    column: $table.targetWeightKg,
    builder: (column) => column,
  );

  GeneratedColumn<String> get activity =>
      $composableBuilder(column: $table.activity, builder: (column) => column);

  GeneratedColumn<String> get pace =>
      $composableBuilder(column: $table.pace, builder: (column) => column);

  GeneratedColumn<String> get foodPreference => $composableBuilder(
    column: $table.foodPreference,
    builder: (column) => column,
  );

  GeneratedColumn<int> get waterTargetMl => $composableBuilder(
    column: $table.waterTargetMl,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get onboardingComplete => $composableBuilder(
    column: $table.onboardingComplete,
    builder: (column) => column,
  );

  GeneratedColumn<int> get currentOnboardingStep => $composableBuilder(
    column: $table.currentOnboardingStep,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$UserProfileTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $UserProfileTableTable,
          UserProfileRow,
          $$UserProfileTableTableFilterComposer,
          $$UserProfileTableTableOrderingComposer,
          $$UserProfileTableTableAnnotationComposer,
          $$UserProfileTableTableCreateCompanionBuilder,
          $$UserProfileTableTableUpdateCompanionBuilder,
          (
            UserProfileRow,
            BaseReferences<
              _$AppDatabase,
              $UserProfileTableTable,
              UserProfileRow
            >,
          ),
          UserProfileRow,
          PrefetchHooks Function()
        > {
  $$UserProfileTableTableTableManager(
    _$AppDatabase db,
    $UserProfileTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$UserProfileTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$UserProfileTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$UserProfileTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> language = const Value.absent(),
                Value<String?> goal = const Value.absent(),
                Value<String?> sex = const Value.absent(),
                Value<int?> age = const Value.absent(),
                Value<double?> heightCm = const Value.absent(),
                Value<double?> currentWeightKg = const Value.absent(),
                Value<double?> targetWeightKg = const Value.absent(),
                Value<String?> activity = const Value.absent(),
                Value<String?> pace = const Value.absent(),
                Value<String?> foodPreference = const Value.absent(),
                Value<int?> waterTargetMl = const Value.absent(),
                Value<bool> onboardingComplete = const Value.absent(),
                Value<int> currentOnboardingStep = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => UserProfileTableCompanion(
                language: language,
                goal: goal,
                sex: sex,
                age: age,
                heightCm: heightCm,
                currentWeightKg: currentWeightKg,
                targetWeightKg: targetWeightKg,
                activity: activity,
                pace: pace,
                foodPreference: foodPreference,
                waterTargetMl: waterTargetMl,
                onboardingComplete: onboardingComplete,
                currentOnboardingStep: currentOnboardingStep,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                Value<String> language = const Value.absent(),
                Value<String?> goal = const Value.absent(),
                Value<String?> sex = const Value.absent(),
                Value<int?> age = const Value.absent(),
                Value<double?> heightCm = const Value.absent(),
                Value<double?> currentWeightKg = const Value.absent(),
                Value<double?> targetWeightKg = const Value.absent(),
                Value<String?> activity = const Value.absent(),
                Value<String?> pace = const Value.absent(),
                Value<String?> foodPreference = const Value.absent(),
                Value<int?> waterTargetMl = const Value.absent(),
                Value<bool> onboardingComplete = const Value.absent(),
                Value<int> currentOnboardingStep = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => UserProfileTableCompanion.insert(
                language: language,
                goal: goal,
                sex: sex,
                age: age,
                heightCm: heightCm,
                currentWeightKg: currentWeightKg,
                targetWeightKg: targetWeightKg,
                activity: activity,
                pace: pace,
                foodPreference: foodPreference,
                waterTargetMl: waterTargetMl,
                onboardingComplete: onboardingComplete,
                currentOnboardingStep: currentOnboardingStep,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$UserProfileTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $UserProfileTableTable,
      UserProfileRow,
      $$UserProfileTableTableFilterComposer,
      $$UserProfileTableTableOrderingComposer,
      $$UserProfileTableTableAnnotationComposer,
      $$UserProfileTableTableCreateCompanionBuilder,
      $$UserProfileTableTableUpdateCompanionBuilder,
      (
        UserProfileRow,
        BaseReferences<_$AppDatabase, $UserProfileTableTable, UserProfileRow>,
      ),
      UserProfileRow,
      PrefetchHooks Function()
    >;
typedef $$FoodsTableCreateCompanionBuilder =
    FoodsCompanion Function({
      required String id,
      required String canonicalName,
      required String category,
      required String defaultPortionUnit,
      Value<double> defaultPortionQty,
      required double defaultPortionGrams,
      required double per100gKcal,
      required double per100gProtein,
      required double per100gCarbs,
      required double per100gFat,
      Value<double?> per100gFiber,
      Value<double?> per100gSodium,
      required String sourceName,
      Value<String?> sourceVersion,
      Value<String?> sourceFoodCode,
      Value<String?> sourceReference,
      Value<DateTime?> importDate,
      Value<bool> isSeed,
      Value<int> rowid,
    });
typedef $$FoodsTableUpdateCompanionBuilder =
    FoodsCompanion Function({
      Value<String> id,
      Value<String> canonicalName,
      Value<String> category,
      Value<String> defaultPortionUnit,
      Value<double> defaultPortionQty,
      Value<double> defaultPortionGrams,
      Value<double> per100gKcal,
      Value<double> per100gProtein,
      Value<double> per100gCarbs,
      Value<double> per100gFat,
      Value<double?> per100gFiber,
      Value<double?> per100gSodium,
      Value<String> sourceName,
      Value<String?> sourceVersion,
      Value<String?> sourceFoodCode,
      Value<String?> sourceReference,
      Value<DateTime?> importDate,
      Value<bool> isSeed,
      Value<int> rowid,
    });

final class $$FoodsTableReferences
    extends BaseReferences<_$AppDatabase, $FoodsTable, FoodsRow> {
  $$FoodsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$FoodAliasesTable, List<FoodAliasesRow>>
  _foodAliasesRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.foodAliases,
    aliasName: 'foods__id__food_aliases__food_id',
  );

  $$FoodAliasesTableProcessedTableManager get foodAliasesRefs {
    final manager = $$FoodAliasesTableTableManager(
      $_db,
      $_db.foodAliases,
    ).filter((f) => f.foodId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_foodAliasesRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<$FoodPortionsTable, List<FoodPortionsRow>>
  _foodPortionsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.foodPortions,
    aliasName: 'foods__id__food_portions__food_id',
  );

  $$FoodPortionsTableProcessedTableManager get foodPortionsRefs {
    final manager = $$FoodPortionsTableTableManager(
      $_db,
      $_db.foodPortions,
    ).filter((f) => f.foodId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_foodPortionsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$FoodsTableFilterComposer extends Composer<_$AppDatabase, $FoodsTable> {
  $$FoodsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get canonicalName => $composableBuilder(
    column: $table.canonicalName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get defaultPortionUnit => $composableBuilder(
    column: $table.defaultPortionUnit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get defaultPortionQty => $composableBuilder(
    column: $table.defaultPortionQty,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get defaultPortionGrams => $composableBuilder(
    column: $table.defaultPortionGrams,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get per100gKcal => $composableBuilder(
    column: $table.per100gKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get per100gProtein => $composableBuilder(
    column: $table.per100gProtein,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get per100gCarbs => $composableBuilder(
    column: $table.per100gCarbs,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get per100gFat => $composableBuilder(
    column: $table.per100gFat,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get per100gFiber => $composableBuilder(
    column: $table.per100gFiber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get per100gSodium => $composableBuilder(
    column: $table.per100gSodium,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceName => $composableBuilder(
    column: $table.sourceName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceVersion => $composableBuilder(
    column: $table.sourceVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceFoodCode => $composableBuilder(
    column: $table.sourceFoodCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceReference => $composableBuilder(
    column: $table.sourceReference,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get importDate => $composableBuilder(
    column: $table.importDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSeed => $composableBuilder(
    column: $table.isSeed,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> foodAliasesRefs(
    Expression<bool> Function($$FoodAliasesTableFilterComposer f) f,
  ) {
    final $$FoodAliasesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.foodAliases,
      getReferencedColumn: (t) => t.foodId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodAliasesTableFilterComposer(
            $db: $db,
            $table: $db.foodAliases,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> foodPortionsRefs(
    Expression<bool> Function($$FoodPortionsTableFilterComposer f) f,
  ) {
    final $$FoodPortionsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.foodPortions,
      getReferencedColumn: (t) => t.foodId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodPortionsTableFilterComposer(
            $db: $db,
            $table: $db.foodPortions,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$FoodsTableOrderingComposer
    extends Composer<_$AppDatabase, $FoodsTable> {
  $$FoodsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get canonicalName => $composableBuilder(
    column: $table.canonicalName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get defaultPortionUnit => $composableBuilder(
    column: $table.defaultPortionUnit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get defaultPortionQty => $composableBuilder(
    column: $table.defaultPortionQty,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get defaultPortionGrams => $composableBuilder(
    column: $table.defaultPortionGrams,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get per100gKcal => $composableBuilder(
    column: $table.per100gKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get per100gProtein => $composableBuilder(
    column: $table.per100gProtein,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get per100gCarbs => $composableBuilder(
    column: $table.per100gCarbs,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get per100gFat => $composableBuilder(
    column: $table.per100gFat,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get per100gFiber => $composableBuilder(
    column: $table.per100gFiber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get per100gSodium => $composableBuilder(
    column: $table.per100gSodium,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceName => $composableBuilder(
    column: $table.sourceName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceVersion => $composableBuilder(
    column: $table.sourceVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceFoodCode => $composableBuilder(
    column: $table.sourceFoodCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceReference => $composableBuilder(
    column: $table.sourceReference,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get importDate => $composableBuilder(
    column: $table.importDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSeed => $composableBuilder(
    column: $table.isSeed,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FoodsTableAnnotationComposer
    extends Composer<_$AppDatabase, $FoodsTable> {
  $$FoodsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get canonicalName => $composableBuilder(
    column: $table.canonicalName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get defaultPortionUnit => $composableBuilder(
    column: $table.defaultPortionUnit,
    builder: (column) => column,
  );

  GeneratedColumn<double> get defaultPortionQty => $composableBuilder(
    column: $table.defaultPortionQty,
    builder: (column) => column,
  );

  GeneratedColumn<double> get defaultPortionGrams => $composableBuilder(
    column: $table.defaultPortionGrams,
    builder: (column) => column,
  );

  GeneratedColumn<double> get per100gKcal => $composableBuilder(
    column: $table.per100gKcal,
    builder: (column) => column,
  );

  GeneratedColumn<double> get per100gProtein => $composableBuilder(
    column: $table.per100gProtein,
    builder: (column) => column,
  );

  GeneratedColumn<double> get per100gCarbs => $composableBuilder(
    column: $table.per100gCarbs,
    builder: (column) => column,
  );

  GeneratedColumn<double> get per100gFat => $composableBuilder(
    column: $table.per100gFat,
    builder: (column) => column,
  );

  GeneratedColumn<double> get per100gFiber => $composableBuilder(
    column: $table.per100gFiber,
    builder: (column) => column,
  );

  GeneratedColumn<double> get per100gSodium => $composableBuilder(
    column: $table.per100gSodium,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sourceName => $composableBuilder(
    column: $table.sourceName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sourceVersion => $composableBuilder(
    column: $table.sourceVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sourceFoodCode => $composableBuilder(
    column: $table.sourceFoodCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sourceReference => $composableBuilder(
    column: $table.sourceReference,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get importDate => $composableBuilder(
    column: $table.importDate,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isSeed =>
      $composableBuilder(column: $table.isSeed, builder: (column) => column);

  Expression<T> foodAliasesRefs<T extends Object>(
    Expression<T> Function($$FoodAliasesTableAnnotationComposer a) f,
  ) {
    final $$FoodAliasesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.foodAliases,
      getReferencedColumn: (t) => t.foodId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodAliasesTableAnnotationComposer(
            $db: $db,
            $table: $db.foodAliases,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<T> foodPortionsRefs<T extends Object>(
    Expression<T> Function($$FoodPortionsTableAnnotationComposer a) f,
  ) {
    final $$FoodPortionsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.foodPortions,
      getReferencedColumn: (t) => t.foodId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodPortionsTableAnnotationComposer(
            $db: $db,
            $table: $db.foodPortions,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$FoodsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FoodsTable,
          FoodsRow,
          $$FoodsTableFilterComposer,
          $$FoodsTableOrderingComposer,
          $$FoodsTableAnnotationComposer,
          $$FoodsTableCreateCompanionBuilder,
          $$FoodsTableUpdateCompanionBuilder,
          (FoodsRow, $$FoodsTableReferences),
          FoodsRow,
          PrefetchHooks Function({bool foodAliasesRefs, bool foodPortionsRefs})
        > {
  $$FoodsTableTableManager(_$AppDatabase db, $FoodsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FoodsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FoodsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FoodsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> canonicalName = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<String> defaultPortionUnit = const Value.absent(),
                Value<double> defaultPortionQty = const Value.absent(),
                Value<double> defaultPortionGrams = const Value.absent(),
                Value<double> per100gKcal = const Value.absent(),
                Value<double> per100gProtein = const Value.absent(),
                Value<double> per100gCarbs = const Value.absent(),
                Value<double> per100gFat = const Value.absent(),
                Value<double?> per100gFiber = const Value.absent(),
                Value<double?> per100gSodium = const Value.absent(),
                Value<String> sourceName = const Value.absent(),
                Value<String?> sourceVersion = const Value.absent(),
                Value<String?> sourceFoodCode = const Value.absent(),
                Value<String?> sourceReference = const Value.absent(),
                Value<DateTime?> importDate = const Value.absent(),
                Value<bool> isSeed = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FoodsCompanion(
                id: id,
                canonicalName: canonicalName,
                category: category,
                defaultPortionUnit: defaultPortionUnit,
                defaultPortionQty: defaultPortionQty,
                defaultPortionGrams: defaultPortionGrams,
                per100gKcal: per100gKcal,
                per100gProtein: per100gProtein,
                per100gCarbs: per100gCarbs,
                per100gFat: per100gFat,
                per100gFiber: per100gFiber,
                per100gSodium: per100gSodium,
                sourceName: sourceName,
                sourceVersion: sourceVersion,
                sourceFoodCode: sourceFoodCode,
                sourceReference: sourceReference,
                importDate: importDate,
                isSeed: isSeed,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String canonicalName,
                required String category,
                required String defaultPortionUnit,
                Value<double> defaultPortionQty = const Value.absent(),
                required double defaultPortionGrams,
                required double per100gKcal,
                required double per100gProtein,
                required double per100gCarbs,
                required double per100gFat,
                Value<double?> per100gFiber = const Value.absent(),
                Value<double?> per100gSodium = const Value.absent(),
                required String sourceName,
                Value<String?> sourceVersion = const Value.absent(),
                Value<String?> sourceFoodCode = const Value.absent(),
                Value<String?> sourceReference = const Value.absent(),
                Value<DateTime?> importDate = const Value.absent(),
                Value<bool> isSeed = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FoodsCompanion.insert(
                id: id,
                canonicalName: canonicalName,
                category: category,
                defaultPortionUnit: defaultPortionUnit,
                defaultPortionQty: defaultPortionQty,
                defaultPortionGrams: defaultPortionGrams,
                per100gKcal: per100gKcal,
                per100gProtein: per100gProtein,
                per100gCarbs: per100gCarbs,
                per100gFat: per100gFat,
                per100gFiber: per100gFiber,
                per100gSodium: per100gSodium,
                sourceName: sourceName,
                sourceVersion: sourceVersion,
                sourceFoodCode: sourceFoodCode,
                sourceReference: sourceReference,
                importDate: importDate,
                isSeed: isSeed,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) =>
                    (e.readTable(table), $$FoodsTableReferences(db, table, e)),
              )
              .toList(),
          prefetchHooksCallback:
              ({foodAliasesRefs = false, foodPortionsRefs = false}) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (foodAliasesRefs) db.foodAliases,
                    if (foodPortionsRefs) db.foodPortions,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (foodAliasesRefs)
                        await $_getPrefetchedData<
                          FoodsRow,
                          $FoodsTable,
                          FoodAliasesRow
                        >(
                          currentTable: table,
                          referencedTable: $$FoodsTableReferences
                              ._foodAliasesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$FoodsTableReferences(
                                db,
                                table,
                                p0,
                              ).foodAliasesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.foodId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (foodPortionsRefs)
                        await $_getPrefetchedData<
                          FoodsRow,
                          $FoodsTable,
                          FoodPortionsRow
                        >(
                          currentTable: table,
                          referencedTable: $$FoodsTableReferences
                              ._foodPortionsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$FoodsTableReferences(
                                db,
                                table,
                                p0,
                              ).foodPortionsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.foodId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$FoodsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FoodsTable,
      FoodsRow,
      $$FoodsTableFilterComposer,
      $$FoodsTableOrderingComposer,
      $$FoodsTableAnnotationComposer,
      $$FoodsTableCreateCompanionBuilder,
      $$FoodsTableUpdateCompanionBuilder,
      (FoodsRow, $$FoodsTableReferences),
      FoodsRow,
      PrefetchHooks Function({bool foodAliasesRefs, bool foodPortionsRefs})
    >;
typedef $$FoodAliasesTableCreateCompanionBuilder =
    FoodAliasesCompanion Function({
      required String foodId,
      required String alias,
      required String language,
      Value<int> rowid,
    });
typedef $$FoodAliasesTableUpdateCompanionBuilder =
    FoodAliasesCompanion Function({
      Value<String> foodId,
      Value<String> alias,
      Value<String> language,
      Value<int> rowid,
    });

final class $$FoodAliasesTableReferences
    extends BaseReferences<_$AppDatabase, $FoodAliasesTable, FoodAliasesRow> {
  $$FoodAliasesTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $FoodsTable _foodIdTable(_$AppDatabase db) =>
      db.foods.createAlias('food_aliases__food_id__foods__id');

  $$FoodsTableProcessedTableManager get foodId {
    final $_column = $_itemColumn<String>('food_id')!;

    final manager = $$FoodsTableTableManager(
      $_db,
      $_db.foods,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_foodIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$FoodAliasesTableFilterComposer
    extends Composer<_$AppDatabase, $FoodAliasesTable> {
  $$FoodAliasesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get alias => $composableBuilder(
    column: $table.alias,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnFilters(column),
  );

  $$FoodsTableFilterComposer get foodId {
    final $$FoodsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.foodId,
      referencedTable: $db.foods,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodsTableFilterComposer(
            $db: $db,
            $table: $db.foods,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$FoodAliasesTableOrderingComposer
    extends Composer<_$AppDatabase, $FoodAliasesTable> {
  $$FoodAliasesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get alias => $composableBuilder(
    column: $table.alias,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get language => $composableBuilder(
    column: $table.language,
    builder: (column) => ColumnOrderings(column),
  );

  $$FoodsTableOrderingComposer get foodId {
    final $$FoodsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.foodId,
      referencedTable: $db.foods,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodsTableOrderingComposer(
            $db: $db,
            $table: $db.foods,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$FoodAliasesTableAnnotationComposer
    extends Composer<_$AppDatabase, $FoodAliasesTable> {
  $$FoodAliasesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get alias =>
      $composableBuilder(column: $table.alias, builder: (column) => column);

  GeneratedColumn<String> get language =>
      $composableBuilder(column: $table.language, builder: (column) => column);

  $$FoodsTableAnnotationComposer get foodId {
    final $$FoodsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.foodId,
      referencedTable: $db.foods,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodsTableAnnotationComposer(
            $db: $db,
            $table: $db.foods,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$FoodAliasesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FoodAliasesTable,
          FoodAliasesRow,
          $$FoodAliasesTableFilterComposer,
          $$FoodAliasesTableOrderingComposer,
          $$FoodAliasesTableAnnotationComposer,
          $$FoodAliasesTableCreateCompanionBuilder,
          $$FoodAliasesTableUpdateCompanionBuilder,
          (FoodAliasesRow, $$FoodAliasesTableReferences),
          FoodAliasesRow,
          PrefetchHooks Function({bool foodId})
        > {
  $$FoodAliasesTableTableManager(_$AppDatabase db, $FoodAliasesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FoodAliasesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FoodAliasesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FoodAliasesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> foodId = const Value.absent(),
                Value<String> alias = const Value.absent(),
                Value<String> language = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FoodAliasesCompanion(
                foodId: foodId,
                alias: alias,
                language: language,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String foodId,
                required String alias,
                required String language,
                Value<int> rowid = const Value.absent(),
              }) => FoodAliasesCompanion.insert(
                foodId: foodId,
                alias: alias,
                language: language,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$FoodAliasesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({foodId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (foodId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.foodId,
                                referencedTable: $$FoodAliasesTableReferences
                                    ._foodIdTable(db),
                                referencedColumn: $$FoodAliasesTableReferences
                                    ._foodIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$FoodAliasesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FoodAliasesTable,
      FoodAliasesRow,
      $$FoodAliasesTableFilterComposer,
      $$FoodAliasesTableOrderingComposer,
      $$FoodAliasesTableAnnotationComposer,
      $$FoodAliasesTableCreateCompanionBuilder,
      $$FoodAliasesTableUpdateCompanionBuilder,
      (FoodAliasesRow, $$FoodAliasesTableReferences),
      FoodAliasesRow,
      PrefetchHooks Function({bool foodId})
    >;
typedef $$FoodPortionsTableCreateCompanionBuilder =
    FoodPortionsCompanion Function({
      required String foodId,
      required String unit,
      Value<double> quantity,
      required double grams,
      Value<int> rowid,
    });
typedef $$FoodPortionsTableUpdateCompanionBuilder =
    FoodPortionsCompanion Function({
      Value<String> foodId,
      Value<String> unit,
      Value<double> quantity,
      Value<double> grams,
      Value<int> rowid,
    });

final class $$FoodPortionsTableReferences
    extends BaseReferences<_$AppDatabase, $FoodPortionsTable, FoodPortionsRow> {
  $$FoodPortionsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $FoodsTable _foodIdTable(_$AppDatabase db) =>
      db.foods.createAlias('food_portions__food_id__foods__id');

  $$FoodsTableProcessedTableManager get foodId {
    final $_column = $_itemColumn<String>('food_id')!;

    final manager = $$FoodsTableTableManager(
      $_db,
      $_db.foods,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_foodIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$FoodPortionsTableFilterComposer
    extends Composer<_$AppDatabase, $FoodPortionsTable> {
  $$FoodPortionsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get quantity => $composableBuilder(
    column: $table.quantity,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get grams => $composableBuilder(
    column: $table.grams,
    builder: (column) => ColumnFilters(column),
  );

  $$FoodsTableFilterComposer get foodId {
    final $$FoodsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.foodId,
      referencedTable: $db.foods,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodsTableFilterComposer(
            $db: $db,
            $table: $db.foods,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$FoodPortionsTableOrderingComposer
    extends Composer<_$AppDatabase, $FoodPortionsTable> {
  $$FoodPortionsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get quantity => $composableBuilder(
    column: $table.quantity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get grams => $composableBuilder(
    column: $table.grams,
    builder: (column) => ColumnOrderings(column),
  );

  $$FoodsTableOrderingComposer get foodId {
    final $$FoodsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.foodId,
      referencedTable: $db.foods,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodsTableOrderingComposer(
            $db: $db,
            $table: $db.foods,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$FoodPortionsTableAnnotationComposer
    extends Composer<_$AppDatabase, $FoodPortionsTable> {
  $$FoodPortionsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get unit =>
      $composableBuilder(column: $table.unit, builder: (column) => column);

  GeneratedColumn<double> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<double> get grams =>
      $composableBuilder(column: $table.grams, builder: (column) => column);

  $$FoodsTableAnnotationComposer get foodId {
    final $$FoodsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.foodId,
      referencedTable: $db.foods,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$FoodsTableAnnotationComposer(
            $db: $db,
            $table: $db.foods,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$FoodPortionsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FoodPortionsTable,
          FoodPortionsRow,
          $$FoodPortionsTableFilterComposer,
          $$FoodPortionsTableOrderingComposer,
          $$FoodPortionsTableAnnotationComposer,
          $$FoodPortionsTableCreateCompanionBuilder,
          $$FoodPortionsTableUpdateCompanionBuilder,
          (FoodPortionsRow, $$FoodPortionsTableReferences),
          FoodPortionsRow,
          PrefetchHooks Function({bool foodId})
        > {
  $$FoodPortionsTableTableManager(_$AppDatabase db, $FoodPortionsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FoodPortionsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FoodPortionsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FoodPortionsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> foodId = const Value.absent(),
                Value<String> unit = const Value.absent(),
                Value<double> quantity = const Value.absent(),
                Value<double> grams = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FoodPortionsCompanion(
                foodId: foodId,
                unit: unit,
                quantity: quantity,
                grams: grams,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String foodId,
                required String unit,
                Value<double> quantity = const Value.absent(),
                required double grams,
                Value<int> rowid = const Value.absent(),
              }) => FoodPortionsCompanion.insert(
                foodId: foodId,
                unit: unit,
                quantity: quantity,
                grams: grams,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$FoodPortionsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({foodId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (foodId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.foodId,
                                referencedTable: $$FoodPortionsTableReferences
                                    ._foodIdTable(db),
                                referencedColumn: $$FoodPortionsTableReferences
                                    ._foodIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$FoodPortionsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FoodPortionsTable,
      FoodPortionsRow,
      $$FoodPortionsTableFilterComposer,
      $$FoodPortionsTableOrderingComposer,
      $$FoodPortionsTableAnnotationComposer,
      $$FoodPortionsTableCreateCompanionBuilder,
      $$FoodPortionsTableUpdateCompanionBuilder,
      (FoodPortionsRow, $$FoodPortionsTableReferences),
      FoodPortionsRow,
      PrefetchHooks Function({bool foodId})
    >;
typedef $$DailyTargetsTableCreateCompanionBuilder =
    DailyTargetsCompanion Function({
      Value<int> id,
      required int targetKcal,
      required int proteinG,
      required int carbsG,
      required int fatG,
      required double bmrKcal,
      required double tdeeKcal,
      required double goalAdjustmentKcal,
      required double activityFactor,
      Value<String?> pace,
      required String formulaVersion,
      required DateTime dateGenerated,
      required int floorKcal,
    });
typedef $$DailyTargetsTableUpdateCompanionBuilder =
    DailyTargetsCompanion Function({
      Value<int> id,
      Value<int> targetKcal,
      Value<int> proteinG,
      Value<int> carbsG,
      Value<int> fatG,
      Value<double> bmrKcal,
      Value<double> tdeeKcal,
      Value<double> goalAdjustmentKcal,
      Value<double> activityFactor,
      Value<String?> pace,
      Value<String> formulaVersion,
      Value<DateTime> dateGenerated,
      Value<int> floorKcal,
    });

class $$DailyTargetsTableFilterComposer
    extends Composer<_$AppDatabase, $DailyTargetsTable> {
  $$DailyTargetsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get targetKcal => $composableBuilder(
    column: $table.targetKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get bmrKcal => $composableBuilder(
    column: $table.bmrKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get tdeeKcal => $composableBuilder(
    column: $table.tdeeKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get goalAdjustmentKcal => $composableBuilder(
    column: $table.goalAdjustmentKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get activityFactor => $composableBuilder(
    column: $table.activityFactor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pace => $composableBuilder(
    column: $table.pace,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get formulaVersion => $composableBuilder(
    column: $table.formulaVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get dateGenerated => $composableBuilder(
    column: $table.dateGenerated,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get floorKcal => $composableBuilder(
    column: $table.floorKcal,
    builder: (column) => ColumnFilters(column),
  );
}

class $$DailyTargetsTableOrderingComposer
    extends Composer<_$AppDatabase, $DailyTargetsTable> {
  $$DailyTargetsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get targetKcal => $composableBuilder(
    column: $table.targetKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get bmrKcal => $composableBuilder(
    column: $table.bmrKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get tdeeKcal => $composableBuilder(
    column: $table.tdeeKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get goalAdjustmentKcal => $composableBuilder(
    column: $table.goalAdjustmentKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get activityFactor => $composableBuilder(
    column: $table.activityFactor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pace => $composableBuilder(
    column: $table.pace,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get formulaVersion => $composableBuilder(
    column: $table.formulaVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get dateGenerated => $composableBuilder(
    column: $table.dateGenerated,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get floorKcal => $composableBuilder(
    column: $table.floorKcal,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DailyTargetsTableAnnotationComposer
    extends Composer<_$AppDatabase, $DailyTargetsTable> {
  $$DailyTargetsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get targetKcal => $composableBuilder(
    column: $table.targetKcal,
    builder: (column) => column,
  );

  GeneratedColumn<int> get proteinG =>
      $composableBuilder(column: $table.proteinG, builder: (column) => column);

  GeneratedColumn<int> get carbsG =>
      $composableBuilder(column: $table.carbsG, builder: (column) => column);

  GeneratedColumn<int> get fatG =>
      $composableBuilder(column: $table.fatG, builder: (column) => column);

  GeneratedColumn<double> get bmrKcal =>
      $composableBuilder(column: $table.bmrKcal, builder: (column) => column);

  GeneratedColumn<double> get tdeeKcal =>
      $composableBuilder(column: $table.tdeeKcal, builder: (column) => column);

  GeneratedColumn<double> get goalAdjustmentKcal => $composableBuilder(
    column: $table.goalAdjustmentKcal,
    builder: (column) => column,
  );

  GeneratedColumn<double> get activityFactor => $composableBuilder(
    column: $table.activityFactor,
    builder: (column) => column,
  );

  GeneratedColumn<String> get pace =>
      $composableBuilder(column: $table.pace, builder: (column) => column);

  GeneratedColumn<String> get formulaVersion => $composableBuilder(
    column: $table.formulaVersion,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get dateGenerated => $composableBuilder(
    column: $table.dateGenerated,
    builder: (column) => column,
  );

  GeneratedColumn<int> get floorKcal =>
      $composableBuilder(column: $table.floorKcal, builder: (column) => column);
}

class $$DailyTargetsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DailyTargetsTable,
          DailyTargetsRow,
          $$DailyTargetsTableFilterComposer,
          $$DailyTargetsTableOrderingComposer,
          $$DailyTargetsTableAnnotationComposer,
          $$DailyTargetsTableCreateCompanionBuilder,
          $$DailyTargetsTableUpdateCompanionBuilder,
          (
            DailyTargetsRow,
            BaseReferences<_$AppDatabase, $DailyTargetsTable, DailyTargetsRow>,
          ),
          DailyTargetsRow,
          PrefetchHooks Function()
        > {
  $$DailyTargetsTableTableManager(_$AppDatabase db, $DailyTargetsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DailyTargetsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DailyTargetsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DailyTargetsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<int> targetKcal = const Value.absent(),
                Value<int> proteinG = const Value.absent(),
                Value<int> carbsG = const Value.absent(),
                Value<int> fatG = const Value.absent(),
                Value<double> bmrKcal = const Value.absent(),
                Value<double> tdeeKcal = const Value.absent(),
                Value<double> goalAdjustmentKcal = const Value.absent(),
                Value<double> activityFactor = const Value.absent(),
                Value<String?> pace = const Value.absent(),
                Value<String> formulaVersion = const Value.absent(),
                Value<DateTime> dateGenerated = const Value.absent(),
                Value<int> floorKcal = const Value.absent(),
              }) => DailyTargetsCompanion(
                id: id,
                targetKcal: targetKcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
                bmrKcal: bmrKcal,
                tdeeKcal: tdeeKcal,
                goalAdjustmentKcal: goalAdjustmentKcal,
                activityFactor: activityFactor,
                pace: pace,
                formulaVersion: formulaVersion,
                dateGenerated: dateGenerated,
                floorKcal: floorKcal,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required int targetKcal,
                required int proteinG,
                required int carbsG,
                required int fatG,
                required double bmrKcal,
                required double tdeeKcal,
                required double goalAdjustmentKcal,
                required double activityFactor,
                Value<String?> pace = const Value.absent(),
                required String formulaVersion,
                required DateTime dateGenerated,
                required int floorKcal,
              }) => DailyTargetsCompanion.insert(
                id: id,
                targetKcal: targetKcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
                bmrKcal: bmrKcal,
                tdeeKcal: tdeeKcal,
                goalAdjustmentKcal: goalAdjustmentKcal,
                activityFactor: activityFactor,
                pace: pace,
                formulaVersion: formulaVersion,
                dateGenerated: dateGenerated,
                floorKcal: floorKcal,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DailyTargetsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DailyTargetsTable,
      DailyTargetsRow,
      $$DailyTargetsTableFilterComposer,
      $$DailyTargetsTableOrderingComposer,
      $$DailyTargetsTableAnnotationComposer,
      $$DailyTargetsTableCreateCompanionBuilder,
      $$DailyTargetsTableUpdateCompanionBuilder,
      (
        DailyTargetsRow,
        BaseReferences<_$AppDatabase, $DailyTargetsTable, DailyTargetsRow>,
      ),
      DailyTargetsRow,
      PrefetchHooks Function()
    >;
typedef $$MealsTableCreateCompanionBuilder =
    MealsCompanion Function({
      Value<int> id,
      required String dateKey,
      required String slot,
      required DateTime createdAt,
    });
typedef $$MealsTableUpdateCompanionBuilder =
    MealsCompanion Function({
      Value<int> id,
      Value<String> dateKey,
      Value<String> slot,
      Value<DateTime> createdAt,
    });

final class $$MealsTableReferences
    extends BaseReferences<_$AppDatabase, $MealsTable, MealsRow> {
  $$MealsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$MealItemsTable, List<MealItemsRow>>
  _mealItemsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.mealItems,
    aliasName: 'meals__id__meal_items__meal_id',
  );

  $$MealItemsTableProcessedTableManager get mealItemsRefs {
    final manager = $$MealItemsTableTableManager(
      $_db,
      $_db.mealItems,
    ).filter((f) => f.mealId.id.sqlEquals($_itemColumn<int>('id')!));

    final cache = $_typedResult.readTableOrNull(_mealItemsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$MealsTableFilterComposer extends Composer<_$AppDatabase, $MealsTable> {
  $$MealsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dateKey => $composableBuilder(
    column: $table.dateKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> mealItemsRefs(
    Expression<bool> Function($$MealItemsTableFilterComposer f) f,
  ) {
    final $$MealItemsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.mealItems,
      getReferencedColumn: (t) => t.mealId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$MealItemsTableFilterComposer(
            $db: $db,
            $table: $db.mealItems,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$MealsTableOrderingComposer
    extends Composer<_$AppDatabase, $MealsTable> {
  $$MealsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dateKey => $composableBuilder(
    column: $table.dateKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$MealsTableAnnotationComposer
    extends Composer<_$AppDatabase, $MealsTable> {
  $$MealsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get dateKey =>
      $composableBuilder(column: $table.dateKey, builder: (column) => column);

  GeneratedColumn<String> get slot =>
      $composableBuilder(column: $table.slot, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  Expression<T> mealItemsRefs<T extends Object>(
    Expression<T> Function($$MealItemsTableAnnotationComposer a) f,
  ) {
    final $$MealItemsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.mealItems,
      getReferencedColumn: (t) => t.mealId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$MealItemsTableAnnotationComposer(
            $db: $db,
            $table: $db.mealItems,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$MealsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MealsTable,
          MealsRow,
          $$MealsTableFilterComposer,
          $$MealsTableOrderingComposer,
          $$MealsTableAnnotationComposer,
          $$MealsTableCreateCompanionBuilder,
          $$MealsTableUpdateCompanionBuilder,
          (MealsRow, $$MealsTableReferences),
          MealsRow,
          PrefetchHooks Function({bool mealItemsRefs})
        > {
  $$MealsTableTableManager(_$AppDatabase db, $MealsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MealsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MealsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MealsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> dateKey = const Value.absent(),
                Value<String> slot = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => MealsCompanion(
                id: id,
                dateKey: dateKey,
                slot: slot,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String dateKey,
                required String slot,
                required DateTime createdAt,
              }) => MealsCompanion.insert(
                id: id,
                dateKey: dateKey,
                slot: slot,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) =>
                    (e.readTable(table), $$MealsTableReferences(db, table, e)),
              )
              .toList(),
          prefetchHooksCallback: ({mealItemsRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [if (mealItemsRefs) db.mealItems],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (mealItemsRefs)
                    await $_getPrefetchedData<
                      MealsRow,
                      $MealsTable,
                      MealItemsRow
                    >(
                      currentTable: table,
                      referencedTable: $$MealsTableReferences
                          ._mealItemsRefsTable(db),
                      managerFromTypedResult: (p0) =>
                          $$MealsTableReferences(db, table, p0).mealItemsRefs,
                      referencedItemsForCurrentItem: (item, referencedItems) =>
                          referencedItems.where((e) => e.mealId == item.id),
                      typedResults: items,
                    ),
                ];
              },
            );
          },
        ),
      );
}

typedef $$MealsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MealsTable,
      MealsRow,
      $$MealsTableFilterComposer,
      $$MealsTableOrderingComposer,
      $$MealsTableAnnotationComposer,
      $$MealsTableCreateCompanionBuilder,
      $$MealsTableUpdateCompanionBuilder,
      (MealsRow, $$MealsTableReferences),
      MealsRow,
      PrefetchHooks Function({bool mealItemsRefs})
    >;
typedef $$MealItemsTableCreateCompanionBuilder =
    MealItemsCompanion Function({
      Value<int> id,
      required int mealId,
      required String foodId,
      required String foodName,
      required String portionUnit,
      required double portionQuantity,
      required double grams,
      required double kcal,
      required double proteinG,
      required double carbsG,
      required double fatG,
      Value<double?> fiberG,
      Value<double?> sodiumMg,
    });
typedef $$MealItemsTableUpdateCompanionBuilder =
    MealItemsCompanion Function({
      Value<int> id,
      Value<int> mealId,
      Value<String> foodId,
      Value<String> foodName,
      Value<String> portionUnit,
      Value<double> portionQuantity,
      Value<double> grams,
      Value<double> kcal,
      Value<double> proteinG,
      Value<double> carbsG,
      Value<double> fatG,
      Value<double?> fiberG,
      Value<double?> sodiumMg,
    });

final class $$MealItemsTableReferences
    extends BaseReferences<_$AppDatabase, $MealItemsTable, MealItemsRow> {
  $$MealItemsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $MealsTable _mealIdTable(_$AppDatabase db) =>
      db.meals.createAlias('meal_items__meal_id__meals__id');

  $$MealsTableProcessedTableManager get mealId {
    final $_column = $_itemColumn<int>('meal_id')!;

    final manager = $$MealsTableTableManager(
      $_db,
      $_db.meals,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_mealIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$MealItemsTableFilterComposer
    extends Composer<_$AppDatabase, $MealItemsTable> {
  $$MealItemsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get foodId => $composableBuilder(
    column: $table.foodId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get foodName => $composableBuilder(
    column: $table.foodName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get portionUnit => $composableBuilder(
    column: $table.portionUnit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get portionQuantity => $composableBuilder(
    column: $table.portionQuantity,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get grams => $composableBuilder(
    column: $table.grams,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fiberG => $composableBuilder(
    column: $table.fiberG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get sodiumMg => $composableBuilder(
    column: $table.sodiumMg,
    builder: (column) => ColumnFilters(column),
  );

  $$MealsTableFilterComposer get mealId {
    final $$MealsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.mealId,
      referencedTable: $db.meals,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$MealsTableFilterComposer(
            $db: $db,
            $table: $db.meals,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$MealItemsTableOrderingComposer
    extends Composer<_$AppDatabase, $MealItemsTable> {
  $$MealItemsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get foodId => $composableBuilder(
    column: $table.foodId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get foodName => $composableBuilder(
    column: $table.foodName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get portionUnit => $composableBuilder(
    column: $table.portionUnit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get portionQuantity => $composableBuilder(
    column: $table.portionQuantity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get grams => $composableBuilder(
    column: $table.grams,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fiberG => $composableBuilder(
    column: $table.fiberG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get sodiumMg => $composableBuilder(
    column: $table.sodiumMg,
    builder: (column) => ColumnOrderings(column),
  );

  $$MealsTableOrderingComposer get mealId {
    final $$MealsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.mealId,
      referencedTable: $db.meals,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$MealsTableOrderingComposer(
            $db: $db,
            $table: $db.meals,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$MealItemsTableAnnotationComposer
    extends Composer<_$AppDatabase, $MealItemsTable> {
  $$MealItemsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get foodId =>
      $composableBuilder(column: $table.foodId, builder: (column) => column);

  GeneratedColumn<String> get foodName =>
      $composableBuilder(column: $table.foodName, builder: (column) => column);

  GeneratedColumn<String> get portionUnit => $composableBuilder(
    column: $table.portionUnit,
    builder: (column) => column,
  );

  GeneratedColumn<double> get portionQuantity => $composableBuilder(
    column: $table.portionQuantity,
    builder: (column) => column,
  );

  GeneratedColumn<double> get grams =>
      $composableBuilder(column: $table.grams, builder: (column) => column);

  GeneratedColumn<double> get kcal =>
      $composableBuilder(column: $table.kcal, builder: (column) => column);

  GeneratedColumn<double> get proteinG =>
      $composableBuilder(column: $table.proteinG, builder: (column) => column);

  GeneratedColumn<double> get carbsG =>
      $composableBuilder(column: $table.carbsG, builder: (column) => column);

  GeneratedColumn<double> get fatG =>
      $composableBuilder(column: $table.fatG, builder: (column) => column);

  GeneratedColumn<double> get fiberG =>
      $composableBuilder(column: $table.fiberG, builder: (column) => column);

  GeneratedColumn<double> get sodiumMg =>
      $composableBuilder(column: $table.sodiumMg, builder: (column) => column);

  $$MealsTableAnnotationComposer get mealId {
    final $$MealsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.mealId,
      referencedTable: $db.meals,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$MealsTableAnnotationComposer(
            $db: $db,
            $table: $db.meals,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$MealItemsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MealItemsTable,
          MealItemsRow,
          $$MealItemsTableFilterComposer,
          $$MealItemsTableOrderingComposer,
          $$MealItemsTableAnnotationComposer,
          $$MealItemsTableCreateCompanionBuilder,
          $$MealItemsTableUpdateCompanionBuilder,
          (MealItemsRow, $$MealItemsTableReferences),
          MealItemsRow,
          PrefetchHooks Function({bool mealId})
        > {
  $$MealItemsTableTableManager(_$AppDatabase db, $MealItemsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MealItemsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MealItemsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MealItemsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<int> mealId = const Value.absent(),
                Value<String> foodId = const Value.absent(),
                Value<String> foodName = const Value.absent(),
                Value<String> portionUnit = const Value.absent(),
                Value<double> portionQuantity = const Value.absent(),
                Value<double> grams = const Value.absent(),
                Value<double> kcal = const Value.absent(),
                Value<double> proteinG = const Value.absent(),
                Value<double> carbsG = const Value.absent(),
                Value<double> fatG = const Value.absent(),
                Value<double?> fiberG = const Value.absent(),
                Value<double?> sodiumMg = const Value.absent(),
              }) => MealItemsCompanion(
                id: id,
                mealId: mealId,
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
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required int mealId,
                required String foodId,
                required String foodName,
                required String portionUnit,
                required double portionQuantity,
                required double grams,
                required double kcal,
                required double proteinG,
                required double carbsG,
                required double fatG,
                Value<double?> fiberG = const Value.absent(),
                Value<double?> sodiumMg = const Value.absent(),
              }) => MealItemsCompanion.insert(
                id: id,
                mealId: mealId,
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
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$MealItemsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({mealId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (mealId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.mealId,
                                referencedTable: $$MealItemsTableReferences
                                    ._mealIdTable(db),
                                referencedColumn: $$MealItemsTableReferences
                                    ._mealIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$MealItemsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MealItemsTable,
      MealItemsRow,
      $$MealItemsTableFilterComposer,
      $$MealItemsTableOrderingComposer,
      $$MealItemsTableAnnotationComposer,
      $$MealItemsTableCreateCompanionBuilder,
      $$MealItemsTableUpdateCompanionBuilder,
      (MealItemsRow, $$MealItemsTableReferences),
      MealItemsRow,
      PrefetchHooks Function({bool mealId})
    >;
typedef $$WaterLogsTableCreateCompanionBuilder =
    WaterLogsCompanion Function({
      Value<int> id,
      required String dateKey,
      required int amountMl,
      required DateTime loggedAt,
    });
typedef $$WaterLogsTableUpdateCompanionBuilder =
    WaterLogsCompanion Function({
      Value<int> id,
      Value<String> dateKey,
      Value<int> amountMl,
      Value<DateTime> loggedAt,
    });

class $$WaterLogsTableFilterComposer
    extends Composer<_$AppDatabase, $WaterLogsTable> {
  $$WaterLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dateKey => $composableBuilder(
    column: $table.dateKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get amountMl => $composableBuilder(
    column: $table.amountMl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get loggedAt => $composableBuilder(
    column: $table.loggedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$WaterLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $WaterLogsTable> {
  $$WaterLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dateKey => $composableBuilder(
    column: $table.dateKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get amountMl => $composableBuilder(
    column: $table.amountMl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get loggedAt => $composableBuilder(
    column: $table.loggedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WaterLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $WaterLogsTable> {
  $$WaterLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get dateKey =>
      $composableBuilder(column: $table.dateKey, builder: (column) => column);

  GeneratedColumn<int> get amountMl =>
      $composableBuilder(column: $table.amountMl, builder: (column) => column);

  GeneratedColumn<DateTime> get loggedAt =>
      $composableBuilder(column: $table.loggedAt, builder: (column) => column);
}

class $$WaterLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WaterLogsTable,
          WaterLogsRow,
          $$WaterLogsTableFilterComposer,
          $$WaterLogsTableOrderingComposer,
          $$WaterLogsTableAnnotationComposer,
          $$WaterLogsTableCreateCompanionBuilder,
          $$WaterLogsTableUpdateCompanionBuilder,
          (
            WaterLogsRow,
            BaseReferences<_$AppDatabase, $WaterLogsTable, WaterLogsRow>,
          ),
          WaterLogsRow,
          PrefetchHooks Function()
        > {
  $$WaterLogsTableTableManager(_$AppDatabase db, $WaterLogsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WaterLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WaterLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WaterLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> dateKey = const Value.absent(),
                Value<int> amountMl = const Value.absent(),
                Value<DateTime> loggedAt = const Value.absent(),
              }) => WaterLogsCompanion(
                id: id,
                dateKey: dateKey,
                amountMl: amountMl,
                loggedAt: loggedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String dateKey,
                required int amountMl,
                required DateTime loggedAt,
              }) => WaterLogsCompanion.insert(
                id: id,
                dateKey: dateKey,
                amountMl: amountMl,
                loggedAt: loggedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WaterLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WaterLogsTable,
      WaterLogsRow,
      $$WaterLogsTableFilterComposer,
      $$WaterLogsTableOrderingComposer,
      $$WaterLogsTableAnnotationComposer,
      $$WaterLogsTableCreateCompanionBuilder,
      $$WaterLogsTableUpdateCompanionBuilder,
      (
        WaterLogsRow,
        BaseReferences<_$AppDatabase, $WaterLogsTable, WaterLogsRow>,
      ),
      WaterLogsRow,
      PrefetchHooks Function()
    >;
typedef $$WeightLogsTableCreateCompanionBuilder =
    WeightLogsCompanion Function({
      Value<int> id,
      required String dateKey,
      required double weightKg,
      required DateTime loggedAt,
    });
typedef $$WeightLogsTableUpdateCompanionBuilder =
    WeightLogsCompanion Function({
      Value<int> id,
      Value<String> dateKey,
      Value<double> weightKg,
      Value<DateTime> loggedAt,
    });

class $$WeightLogsTableFilterComposer
    extends Composer<_$AppDatabase, $WeightLogsTable> {
  $$WeightLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dateKey => $composableBuilder(
    column: $table.dateKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get weightKg => $composableBuilder(
    column: $table.weightKg,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get loggedAt => $composableBuilder(
    column: $table.loggedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$WeightLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $WeightLogsTable> {
  $$WeightLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dateKey => $composableBuilder(
    column: $table.dateKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get weightKg => $composableBuilder(
    column: $table.weightKg,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get loggedAt => $composableBuilder(
    column: $table.loggedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WeightLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $WeightLogsTable> {
  $$WeightLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get dateKey =>
      $composableBuilder(column: $table.dateKey, builder: (column) => column);

  GeneratedColumn<double> get weightKg =>
      $composableBuilder(column: $table.weightKg, builder: (column) => column);

  GeneratedColumn<DateTime> get loggedAt =>
      $composableBuilder(column: $table.loggedAt, builder: (column) => column);
}

class $$WeightLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WeightLogsTable,
          WeightLogsRow,
          $$WeightLogsTableFilterComposer,
          $$WeightLogsTableOrderingComposer,
          $$WeightLogsTableAnnotationComposer,
          $$WeightLogsTableCreateCompanionBuilder,
          $$WeightLogsTableUpdateCompanionBuilder,
          (
            WeightLogsRow,
            BaseReferences<_$AppDatabase, $WeightLogsTable, WeightLogsRow>,
          ),
          WeightLogsRow,
          PrefetchHooks Function()
        > {
  $$WeightLogsTableTableManager(_$AppDatabase db, $WeightLogsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WeightLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WeightLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WeightLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> dateKey = const Value.absent(),
                Value<double> weightKg = const Value.absent(),
                Value<DateTime> loggedAt = const Value.absent(),
              }) => WeightLogsCompanion(
                id: id,
                dateKey: dateKey,
                weightKg: weightKg,
                loggedAt: loggedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String dateKey,
                required double weightKg,
                required DateTime loggedAt,
              }) => WeightLogsCompanion.insert(
                id: id,
                dateKey: dateKey,
                weightKg: weightKg,
                loggedAt: loggedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WeightLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WeightLogsTable,
      WeightLogsRow,
      $$WeightLogsTableFilterComposer,
      $$WeightLogsTableOrderingComposer,
      $$WeightLogsTableAnnotationComposer,
      $$WeightLogsTableCreateCompanionBuilder,
      $$WeightLogsTableUpdateCompanionBuilder,
      (
        WeightLogsRow,
        BaseReferences<_$AppDatabase, $WeightLogsTable, WeightLogsRow>,
      ),
      WeightLogsRow,
      PrefetchHooks Function()
    >;
typedef $$SeedMetaTableCreateCompanionBuilder =
    SeedMetaCompanion Function({
      required String key,
      required String value,
      Value<int> rowid,
    });
typedef $$SeedMetaTableUpdateCompanionBuilder =
    SeedMetaCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<int> rowid,
    });

class $$SeedMetaTableFilterComposer
    extends Composer<_$AppDatabase, $SeedMetaTable> {
  $$SeedMetaTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SeedMetaTableOrderingComposer
    extends Composer<_$AppDatabase, $SeedMetaTable> {
  $$SeedMetaTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SeedMetaTableAnnotationComposer
    extends Composer<_$AppDatabase, $SeedMetaTable> {
  $$SeedMetaTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$SeedMetaTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SeedMetaTable,
          SeedMetaRow,
          $$SeedMetaTableFilterComposer,
          $$SeedMetaTableOrderingComposer,
          $$SeedMetaTableAnnotationComposer,
          $$SeedMetaTableCreateCompanionBuilder,
          $$SeedMetaTableUpdateCompanionBuilder,
          (
            SeedMetaRow,
            BaseReferences<_$AppDatabase, $SeedMetaTable, SeedMetaRow>,
          ),
          SeedMetaRow,
          PrefetchHooks Function()
        > {
  $$SeedMetaTableTableManager(_$AppDatabase db, $SeedMetaTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SeedMetaTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SeedMetaTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SeedMetaTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SeedMetaCompanion(key: key, value: value, rowid: rowid),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<int> rowid = const Value.absent(),
              }) => SeedMetaCompanion.insert(
                key: key,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SeedMetaTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SeedMetaTable,
      SeedMetaRow,
      $$SeedMetaTableFilterComposer,
      $$SeedMetaTableOrderingComposer,
      $$SeedMetaTableAnnotationComposer,
      $$SeedMetaTableCreateCompanionBuilder,
      $$SeedMetaTableUpdateCompanionBuilder,
      (SeedMetaRow, BaseReferences<_$AppDatabase, $SeedMetaTable, SeedMetaRow>),
      SeedMetaRow,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$UserProfileTableTableTableManager get userProfileTable =>
      $$UserProfileTableTableTableManager(_db, _db.userProfileTable);
  $$FoodsTableTableManager get foods =>
      $$FoodsTableTableManager(_db, _db.foods);
  $$FoodAliasesTableTableManager get foodAliases =>
      $$FoodAliasesTableTableManager(_db, _db.foodAliases);
  $$FoodPortionsTableTableManager get foodPortions =>
      $$FoodPortionsTableTableManager(_db, _db.foodPortions);
  $$DailyTargetsTableTableManager get dailyTargets =>
      $$DailyTargetsTableTableManager(_db, _db.dailyTargets);
  $$MealsTableTableManager get meals =>
      $$MealsTableTableManager(_db, _db.meals);
  $$MealItemsTableTableManager get mealItems =>
      $$MealItemsTableTableManager(_db, _db.mealItems);
  $$WaterLogsTableTableManager get waterLogs =>
      $$WaterLogsTableTableManager(_db, _db.waterLogs);
  $$WeightLogsTableTableManager get weightLogs =>
      $$WeightLogsTableTableManager(_db, _db.weightLogs);
  $$SeedMetaTableTableManager get seedMeta =>
      $$SeedMetaTableTableManager(_db, _db.seedMeta);
}
