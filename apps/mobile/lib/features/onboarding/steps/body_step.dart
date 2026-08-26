import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';
import 'package:nourish_domain/domain.dart';

import '../../../l10n/strings.dart';
import '../../../providers.dart';
import '../../../router/routes.dart';
import '../onboarding_controller.dart';
import '../onboarding_flow.dart';

/// ONB-04 body information: sex segmented control (Female pre-selected)
/// and age/height/current/target weight fields with PPA-3 ranges.
/// Out-of-range values are marked with field-level errors and block
/// advancing — never silently clamped.
class BodyStepScreen extends ConsumerStatefulWidget {
  const BodyStepScreen({super.key});

  @override
  ConsumerState<BodyStepScreen> createState() => _BodyStepScreenState();
}

class _BodyStepScreenState extends ConsumerState<BodyStepScreen> {
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _heightController = TextEditingController();
  final TextEditingController _currentWeightController =
      TextEditingController();
  final TextEditingController _targetWeightController =
      TextEditingController();

  @override
  void initState() {
    super.initState();
    // Prefill from a resumed draft (ONB-09): raw values the user typed
    // are not stored, so numeric fields re-populate from parsed values.
    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      final UserProfile? profile = ref.read(onboardingControllerProvider)
          .profile;
      if (profile == null) {
        return;
      }
      if (profile.age != null) {
        _ageController.text = '${profile.age}';
      }
      if (profile.heightCm != null) {
        _heightController.text = _formatNumber(profile.heightCm!);
      }
      if (profile.currentWeightKg != null) {
        _currentWeightController.text = _formatNumber(profile.currentWeightKg!);
      }
      if (profile.targetWeightKg != null) {
        _targetWeightController.text = _formatNumber(profile.targetWeightKg!);
      }
    });
  }

  static String _formatNumber(double value) {
    return value % 1 == 0 ? value.toInt().toString() : value.toString();
  }

  @override
  void dispose() {
    _ageController.dispose();
    _heightController.dispose();
    _currentWeightController.dispose();
    _targetWeightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final OnboardingState onboarding = ref.watch(onboardingControllerProvider);
    final OnboardingController controller = ref.read(
      onboardingControllerProvider.notifier,
    );
    final UserProfile? profile = onboarding.profile;
    final Sex sex = profile?.sex ?? Sex.female;

    Future<void> continuePressed() async {
      final bool ok = await controller.continueFrom(OnboardingStep.body);
      if (ok && context.mounted) {
        context.go(AppRoutes.onboardingActivity);
      }
    }

    return OnboardingFlow(
      step: OnboardingStep.body,
      onBack: () => context.go(AppRoutes.onboardingGoal),
      actionBar: NourishButton(
        label: Strings.continueLabel,
        icon: Icons.arrow_forward,
        onPressed: onboarding.isBusy ? null : continuePressed,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            Strings.bodyTitle,
            style: NourishTextStyles.headlineLgMobile.copyWith(
              color: NourishColors.onBackground,
            ),
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          Text(
            Strings.biologicalSex.toUpperCase(),
            style: NourishTextStyles.labelCaps.copyWith(
              color: NourishColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          SegmentedSelector<Sex>(
            options: const <SegmentedSelectorOption<Sex>>[
              SegmentedSelectorOption<Sex>(
                value: Sex.female,
                label: Strings.sexFemale,
              ),
              SegmentedSelectorOption<Sex>(
                value: Sex.male,
                label: Strings.sexMale,
              ),
            ],
            value: sex,
            onChanged: controller.setSex,
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: NourishInputField(
                  controller: _ageController,
                  label: Strings.ageLabel,
                  hint: Strings.ageHint,
                  suffix: Strings.unitYears,
                  keyboardType: TextInputType.number,
                  errorText: onboarding.bodyErrors['age'],
                  onChanged: (String value) =>
                      controller.setBodyField('age', value),
                ),
              ),
              const SizedBox(width: NourishSpacing.gutter),
              Expanded(
                child: NourishInputField(
                  controller: _heightController,
                  label: Strings.heightLabel,
                  hint: Strings.heightHint,
                  suffix: Strings.unitCm,
                  keyboardType: TextInputType.number,
                  errorText: onboarding.bodyErrors['height'],
                  onChanged: (String value) =>
                      controller.setBodyField('height', value),
                ),
              ),
            ],
          ),
          const SizedBox(height: NourishSpacing.sectionGap),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: NourishInputField(
                  controller: _currentWeightController,
                  label: Strings.currentWeightLabel,
                  hint: Strings.weightHint,
                  suffix: Strings.unitKg,
                  keyboardType: TextInputType.number,
                  errorText: onboarding.bodyErrors['currentWeight'],
                  onChanged: (String value) =>
                      controller.setBodyField('currentWeight', value),
                ),
              ),
              const SizedBox(width: NourishSpacing.gutter),
              Expanded(
                child: NourishInputField(
                  controller: _targetWeightController,
                  label: Strings.targetWeightLabel,
                  hint: Strings.weightHint,
                  suffix: Strings.unitKg,
                  keyboardType: TextInputType.number,
                  errorText: onboarding.bodyErrors['targetWeight'],
                  onChanged: (String value) =>
                      controller.setBodyField('targetWeight', value),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
