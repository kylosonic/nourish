import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/account_session.dart';
import '../../data/services/token_store.dart';
import '../../data/sources/auth_api_client.dart';
import '../../providers.dart';

/// Where the sign-in flow currently is.
enum SignInStage {
  /// Asking for the phone number.
  phone,

  /// A code was sent; the user is entering it.
  code,

  /// The code was accepted and the session is stored.
  signedIn,
}

/// The sign-in surface's state.
class AuthState {
  const AuthState({
    this.stage = SignInStage.phone,
    this.phoneE164,
    this.account,
    this.requestingCode = false,
    this.verifying = false,
    this.resendAfterSeconds = 0,
    this.errorMessage,
    this.restoring = true,
  });

  final SignInStage stage;

  /// The number the server normalized, once it has answered.
  final String? phoneE164;

  /// The signed-in account, when there is one.
  final Account? account;

  final bool requestingCode;
  final bool verifying;

  /// Seconds the server asked the app to wait before another code.
  final int resendAfterSeconds;

  /// The sentence to show for the last failure, or null.
  final String? errorMessage;

  /// True while the stored session is being read at launch, so the screen does
  /// not flash "signed out" before it knows.
  final bool restoring;

  bool get isSignedIn => stage == SignInStage.signedIn && account != null;

  AuthState copyWith({
    SignInStage? stage,
    String? phoneE164,
    Account? account,
    bool? requestingCode,
    bool? verifying,
    int? resendAfterSeconds,
    String? errorMessage,
    bool clearError = false,
    bool? restoring,
  }) {
    return AuthState(
      stage: stage ?? this.stage,
      phoneE164: phoneE164 ?? this.phoneE164,
      account: account ?? this.account,
      requestingCode: requestingCode ?? this.requestingCode,
      verifying: verifying ?? this.verifying,
      resendAfterSeconds: resendAfterSeconds ?? this.resendAfterSeconds,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      restoring: restoring ?? this.restoring,
    );
  }
}

/// Accounts and sessions on the device (S3, ADR-0008).
///
/// The app is usable signed out — every logged meal, weight and glass of water
/// is stored locally either way — so nothing here is allowed to block the rest
/// of the app, and a failure is reported as a failure rather than retried
/// silently against the user's wishes.
class AuthController extends Notifier<AuthState> {
  Timer? _resendTicker;

  @override
  AuthState build() {
    ref.onDispose(() => _resendTicker?.cancel());
    // Restore in the background: the UI shows "checking" until this finishes,
    // which is honest about not knowing yet.
    unawaited(_restore());
    return const AuthState();
  }

  AuthApi get _api => ref.read(authApiProvider);
  TokenStore get _store => ref.read(tokenStoreProvider);

  Future<void> _restore() async {
    try {
      final SessionTokens? stored = await _store.read();
      if (stored == null) {
        state = state.copyWith(restoring: false);
        return;
      }
      // A stored token is not proof of a live session: ask the server who this
      // is, and on an expired access token rotate it once.
      try {
        final Account account = await _api.me(stored.accessToken);
        state = state.copyWith(
          stage: SignInStage.signedIn,
          account: account,
          phoneE164: account.phoneE164,
          restoring: false,
        );
      } on AuthException catch (error) {
        if (error.code != 'TOKEN_EXPIRED' &&
            error.code != 'UNAUTHENTICATED' &&
            error.code != 'HTTP_401') {
          rethrow;
        }
        final SessionTokens rotated = await _api.refresh(stored.refreshToken);
        await _store.write(rotated);
        final Account account = await _api.me(rotated.accessToken);
        state = state.copyWith(
          stage: SignInStage.signedIn,
          account: account,
          phoneE164: account.phoneE164,
          restoring: false,
        );
      }
    } on AuthException catch (error) {
      // The session could not be confirmed. Say so and stay signed out rather
      // than pretending to be signed in.
      state = state.copyWith(
        restoring: false,
        errorMessage: error.message,
      );
    } catch (_) {
      state = state.copyWith(restoring: false);
    }
  }

  /// AUTH-02: ask for a code. The caller's phone string is passed through as
  /// typed; normalizing it is the server's job (AUTH-01).
  Future<void> requestCode(String phone) async {
    state = state.copyWith(
      requestingCode: true,
      clearError: true,
      phoneE164: phone,
    );
    try {
      final OtpRequestAck ack = await _api.requestOtp(phone);
      state = state.copyWith(
        stage: SignInStage.code,
        phoneE164: ack.phoneE164,
        requestingCode: false,
        resendAfterSeconds: ack.resendAfterSeconds,
      );
      _startResendTicker();
    } on AuthException catch (error) {
      state = state.copyWith(
        requestingCode: false,
        errorMessage: _messageFor(error),
      );
    }
  }

  /// AUTH-02: exchange the code for a session and store it securely.
  Future<void> verifyCode(String code) async {
    final String? phone = state.phoneE164;
    if (phone == null) {
      state = state.copyWith(
        errorMessage: 'Enter your number again before the code.',
      );
      return;
    }
    state = state.copyWith(verifying: true, clearError: true);
    try {
      final SignedInSession session = await _api.verifyOtp(
        phone: phone,
        code: code,
      );
      await _store.write(session.tokens);
      state = state.copyWith(
        stage: SignInStage.signedIn,
        account: session.account,
        phoneE164: session.account.phoneE164,
        verifying: false,
      );
    } on AuthException catch (error) {
      state = state.copyWith(
        verifying: false,
        errorMessage: _messageFor(error),
      );
    }
  }

  /// Return to the phone step (a wrong number, or after a failed code).
  void backToPhone() {
    _resendTicker?.cancel();
    state = state.copyWith(
      stage: SignInStage.phone,
      resendAfterSeconds: 0,
      clearError: true,
    );
  }

  /// AUTH-03: end this device's session.
  ///
  /// The device is cleared even when the server cannot be reached: the user
  /// asked to sign out, and a local session that cannot be removed is worse
  /// than a server-side one that expires on its own. Returns false when the
  /// server could not be told, so the UI can say exactly that.
  Future<bool> signOut() async {
    final SessionTokens? stored = await _store.read();
    await _store.clear();
    _resendTicker?.cancel();
    state = const AuthState(stage: SignInStage.phone, restoring: false);
    if (stored == null) return true;
    try {
      await _api.logout(stored.refreshToken);
      return true;
    } on AuthException {
      return false;
    }
  }

  void _startResendTicker() {
    _resendTicker?.cancel();
    if (state.resendAfterSeconds <= 0) return;
    _resendTicker = Timer.periodic(const Duration(seconds: 1), (Timer timer) {
      final int left = state.resendAfterSeconds - 1;
      if (left <= 0) {
        timer.cancel();
        state = state.copyWith(resendAfterSeconds: 0);
        return;
      }
      state = state.copyWith(resendAfterSeconds: left);
    });
  }

  /// Server messages are shown as the server wrote them, except where the app
  /// can be more useful about what to do next. The code is never hidden: a
  /// deliberately vague failure here would just make the user retry blindly.
  String _messageFor(AuthException error) {
    return switch (error.code) {
      'SMS_UNAVAILABLE' =>
        'Nourish cannot send codes right now (no SMS gateway is configured). '
            'Your data stays on this device.',
      'NETWORK' => 'Nourish could not be reached. Check your connection.',
      'OTP_EXPIRED' => 'That code expired. Ask for a new one.',
      // The server counts the attempts down and says how many are left, which
      // is more useful than anything the app could write here.
      'OTP_INVALID' => error.message,
      'OTP_TOO_MANY_ATTEMPTS' => 'Too many attempts. Ask for a new code.',
      'OTP_RESEND_TOO_SOON' => 'A code was just sent. Wait a moment.',
      'PHONE_INVALID' =>
        'That number could not be read as an Ethiopian mobile number.',
      'RATE_LIMITED' => 'Too many requests. Try again in a minute.',
      _ => error.message,
    };
  }
}

final NotifierProvider<AuthController, AuthState> authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
