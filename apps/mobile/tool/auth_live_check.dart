// Manual live check for the S3 sign-in client (AUTH-01/02/03).
//
// This is not part of the test suite: it talks to a real API over a real
// socket, which is exactly what the suite must never do. It exists so the
// mobile client can be exercised against the running server instead of only
// against a fake, and it is run by hand:
//
//   # with the API running (SMS_PROVIDER=console) and Docker up:
//   dart run tool/auth_live_check.dart request +251911000123
//   # read the code from the API log, then:
//   dart run tool/auth_live_check.dart session +251911000123 123456
//
// It prints what the server said at each step, including the error envelope
// when a step is refused. It deliberately touches only the transport and the
// models: importing the token store would pull the Flutter SDK into a plain
// `dart run`, and the store is covered by the widget tests instead.

import 'dart:io';

import 'package:nourish_mobile/data/models/account_session.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';

Future<void> main(List<String> args) async {
  if (args.length < 2) {
    stderr.writeln(
      'usage: auth_live_check.dart request <phone> | session <phone> <code>',
    );
    exit(64);
  }

  final String baseUrl =
      Platform.environment['NOURISH_API_BASE_URL'] ?? 'http://127.0.0.1:3000';
  final AuthApi api = AuthApi(baseUrl: baseUrl);
  final String phone = args[1];
  stdout.writeln('base=$baseUrl phone=$phone');

  try {
    switch (args[0]) {
      case 'request':
        final OtpRequestAck ack = await api.requestOtp(phone);
        stdout.writeln('otp: accepted for ${ack.phoneE164}');
        stdout.writeln(
          'otp: code expires in ${ack.expiresInSeconds}s, '
          'resend after ${ack.resendAfterSeconds}s',
        );
      case 'session':
        if (args.length < 3) {
          stderr.writeln('session needs the code as the third argument');
          exit(64);
        }
        final SignedInSession session = await api.verifyOtp(
          phone: phone,
          code: args[2],
        );
        stdout.writeln('verify: account ${session.account.id}');
        stdout.writeln(
          'verify: number ${session.account.phoneE164} '
          'plan ${session.account.plan.name} '
          'consent ${session.account.aiImprovementConsent} '
          'sessions ${session.account.activeSessions}',
        );
        stdout.writeln(
          'verify: access token ${session.tokens.accessToken.length} chars, '
          'expires in ${session.tokens.expiresInSeconds}s',
        );

        // Use the access token exactly as the app would after storing it.
        final Account account = await api.me(session.tokens.accessToken);
        stdout.writeln('me: ${account.phoneE164} plan ${account.plan.name}');

        final SessionTokens rotated = await api.refresh(session.tokens.refreshToken);
        stdout.writeln(
          'refresh: rotated to a ${rotated.accessToken.length}-char token',
        );

        // Replaying the old refresh token must be refused: that is the reuse
        // detection the server implements, seen from the client.
        try {
          await api.refresh(session.tokens.refreshToken);
          stdout.writeln('refresh-replay: UNEXPECTEDLY ACCEPTED');
          exit(1);
        } on AuthException catch (error) {
          stdout.writeln('refresh-replay: refused with ${error.code}');
        }

        await api.logout(rotated.refreshToken);
        stdout.writeln('logout: session ended');
        stdout.writeln('result: PASS');
      default:
        stderr.writeln('unknown command ${args[0]}');
        exit(64);
    }
  } on AuthException catch (error) {
    stdout.writeln('refused: ${error.code} — ${error.message}');
    exit(1);
  }
}
