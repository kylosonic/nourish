/// Account and session models for the sign-in surface (S3, ADR-0008).
///
/// These mirror the API's own views (`SessionTokens`, `AccountView`,
/// `OtpRequestResult`) field for field. Nothing here is computed locally: the
/// server owns identity, the plan and consent, and the app displays what it is
/// told rather than deriving its own version of it.
library;

/// The subscription plan the server reports.
enum AccountPlan { free, premium }

AccountPlan accountPlanFrom(String? raw) =>
    raw?.toLowerCase() == 'premium' ? AccountPlan.premium : AccountPlan.free;

/// The credentials for one device session. Stored only in secure storage.
class SessionTokens {
  const SessionTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresInSeconds,
  });

  final String accessToken;
  final String refreshToken;

  /// Access-token lifetime in seconds, as the server reported it.
  final int expiresInSeconds;

  factory SessionTokens.fromJson(Map<String, dynamic> json) => SessionTokens(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
    expiresInSeconds: (json['expiresIn'] as num?)?.toInt() ?? 0,
  );
}

/// What the server says about the signed-in account.
class Account {
  const Account({
    required this.id,
    required this.phoneE164,
    required this.plan,
    required this.aiImprovementConsent,
    required this.activeSessions,
    this.planValidUntil,
  });

  final String id;

  /// The normalized number the server decided this account is (AUTH-01).
  final String phoneE164;

  final AccountPlan plan;

  /// Server-owned consent flag; the app never flips it locally.
  final bool aiImprovementConsent;

  /// How many device sessions the account currently has.
  final int activeSessions;

  final DateTime? planValidUntil;

  factory Account.fromJson(Map<String, dynamic> json) {
    final String? validUntil = json['planValidUntil'] as String?;
    return Account(
      id: json['id'] as String,
      phoneE164: json['phoneE164'] as String,
      plan: accountPlanFrom(json['plan'] as String?),
      aiImprovementConsent: json['aiImprovementConsent'] as bool? ?? false,
      activeSessions: (json['activeSessions'] as num?)?.toInt() ?? 0,
      planValidUntil: validUntil == null ? null : DateTime.tryParse(validUntil),
    );
  }
}

/// The result of asking for a code: the number the server normalized, and when
/// another code may be requested. The code itself is never in a response.
class OtpRequestAck {
  const OtpRequestAck({
    required this.phoneE164,
    required this.expiresInSeconds,
    required this.resendAfterSeconds,
  });

  final String phoneE164;
  final int expiresInSeconds;
  final int resendAfterSeconds;

  factory OtpRequestAck.fromJson(Map<String, dynamic> json) => OtpRequestAck(
    phoneE164: json['phoneE164'] as String,
    expiresInSeconds: (json['expiresIn'] as num?)?.toInt() ?? 0,
    resendAfterSeconds: (json['resendAfter'] as num?)?.toInt() ?? 0,
  );
}

/// A signed-in session: the tokens plus the account they belong to.
class SignedInSession {
  const SignedInSession({required this.tokens, required this.account});

  final SessionTokens tokens;
  final Account account;
}
