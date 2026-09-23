import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nourish_design_system/nourish_design_system.dart';

import '../../l10n/strings.dart';
import 'auth_controller.dart';

/// S3 sign-in (AUTH-01/02/03).
///
/// Two steps, no password: the number, then the six-digit code the server sent.
/// P-AUTH-1 (the designed screen) does not exist, so the layout follows the
/// existing form system and is recorded as PPA-16.
///
/// The screen states what signing in does and does not do: the account is real
/// and the session is real, but backup/sync is not built, so nothing is
/// uploaded. Saying that is better than letting a green tick imply a backup
/// that does not exist.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final TextEditingController _phone = TextEditingController();
  final TextEditingController _code = TextEditingController();
  String? _phoneError;
  String? _codeError;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final String phone = _phone.text.trim();
    if (phone.length < 9) {
      setState(() => _phoneError = Strings.signInPhoneInvalid);
      return;
    }
    setState(() => _phoneError = null);
    await ref.read(authControllerProvider.notifier).requestCode(phone);
  }

  Future<void> _verify() async {
    final String code = _code.text.trim();
    if (code.length != 6 || int.tryParse(code) == null) {
      setState(() => _codeError = Strings.signInCodeInvalid);
      return;
    }
    setState(() => _codeError = null);
    await ref.read(authControllerProvider.notifier).verifyCode(code);
  }

  @override
  Widget build(BuildContext context) {
    final AuthState auth = ref.watch(authControllerProvider);

    // Signing in is the end of this screen's job: return to the account screen
    // that opened it rather than leaving a completed form on the stack.
    ref.listen<AuthState>(authControllerProvider, (
      AuthState? previous,
      AuthState next,
    ) {
      if (next.isSignedIn && context.canPop()) context.pop();
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          Strings.signInTitle,
          style: TextStyle(color: NourishColors.primary),
        ),
        leading: context.canPop()
            ? IconButton(
                tooltip: Strings.backTooltip,
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            NourishSpacing.containerMargin,
            NourishSpacing.base,
            NourishSpacing.containerMargin,
            NourishSpacing.sectionGap,
          ),
          children: <Widget>[
            Text(
              Strings.signInSubtitle,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: NourishSpacing.sectionGap),
            if (auth.stage == SignInStage.phone)
              _PhoneStep(
                controller: _phone,
                error: _phoneError,
                busy: auth.requestingCode,
                onSubmit: _sendCode,
              )
            else
              _CodeStep(
                phone: auth.phoneE164 ?? '',
                controller: _code,
                error: _codeError,
                busy: auth.verifying,
                resendAfterSeconds: auth.resendAfterSeconds,
                onSubmit: _verify,
                onResend: _sendCode,
                onChangeNumber: () {
                  _code.clear();
                  ref.read(authControllerProvider.notifier).backToPhone();
                },
              ),
            if (auth.errorMessage != null) ...<Widget>[
              const SizedBox(height: NourishSpacing.gutter),
              NourishCard(
                padding: const EdgeInsets.all(16),
                child: Text(
                  auth.errorMessage!,
                  style: NourishTextStyles.bodyMd.copyWith(
                    color: NourishColors.error,
                  ),
                ),
              ),
            ],
            const SizedBox(height: NourishSpacing.gutter),
            Text(
              Strings.signInLocalOnly,
              style: NourishTextStyles.bodyMd.copyWith(
                fontSize: 13,
                color: NourishColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhoneStep extends StatelessWidget {
  const _PhoneStep({
    required this.controller,
    required this.error,
    required this.busy,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final String? error;
  final bool busy;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        NourishInputField(
          controller: controller,
          label: Strings.signInPhoneLabel,
          hint: Strings.signInPhoneHint,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.done,
          errorText: error,
          onSubmitted: (_) => onSubmit(),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        NourishButton(
          label: busy ? Strings.signInSending : Strings.signInSendCode,
          onPressed: busy ? null : onSubmit,
        ),
      ],
    );
  }
}

class _CodeStep extends StatelessWidget {
  const _CodeStep({
    required this.phone,
    required this.controller,
    required this.error,
    required this.busy,
    required this.resendAfterSeconds,
    required this.onSubmit,
    required this.onResend,
    required this.onChangeNumber,
  });

  final String phone;
  final TextEditingController controller;
  final String? error;
  final bool busy;
  final int resendAfterSeconds;
  final VoidCallback onSubmit;
  final VoidCallback onResend;
  final VoidCallback onChangeNumber;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          Strings.signInCodeSentTo(phone),
          style: NourishTextStyles.bodyMd.copyWith(
            color: NourishColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        NourishInputField(
          controller: controller,
          label: Strings.signInCodeLabel,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          errorText: error,
          onSubmitted: (_) => onSubmit(),
        ),
        const SizedBox(height: NourishSpacing.gutter),
        NourishButton(
          label: busy ? Strings.signInVerifying : Strings.signInVerify,
          onPressed: busy ? null : onSubmit,
        ),
        const SizedBox(height: 8),
        NourishButton(
          variant: NourishButtonVariant.secondary,
          label: resendAfterSeconds > 0
              ? Strings.signInResendIn(resendAfterSeconds)
              : Strings.signInResend,
          onPressed: resendAfterSeconds > 0 ? null : onResend,
        ),
        const SizedBox(height: 8),
        NourishButton(
          variant: NourishButtonVariant.secondary,
          label: Strings.signInChangeNumber,
          onPressed: busy ? null : onChangeNumber,
        ),
      ],
    );
  }
}
