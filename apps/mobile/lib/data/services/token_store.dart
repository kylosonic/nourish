import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/account_session.dart';

/// Where the device keeps its session tokens (S3, ADR-0008).
///
/// A seam, not a convenience: the auth controller depends on this interface, so
/// widget tests never touch platform storage, and there is exactly one
/// implementation that writes to disk.
abstract interface class TokenStore {
  /// The stored session, or null when this device has never signed in (or has
  /// signed out).
  Future<SessionTokens?> read();

  Future<void> write(SessionTokens tokens);

  Future<void> clear();
}

/// The shipped store: platform secure storage (Android Keystore / iOS
/// Keychain), never a plain file and never SharedPreferences.
///
/// Tokens are the whole of a session, so a device-local plaintext copy would be
/// the same as leaving the account unlocked. The plugin's own defaults are used
/// deliberately: since v10 it is encrypted on every platform it supports, and
/// hand-setting options here would be a second place to get privacy wrong.
class SecureTokenStore implements TokenStore {
  SecureTokenStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const String _accessKey = 'nourish.auth.accessToken';
  static const String _refreshKey = 'nourish.auth.refreshToken';
  static const String _expiresKey = 'nourish.auth.expiresIn';

  final FlutterSecureStorage _storage;

  @override
  Future<SessionTokens?> read() async {
    final String? access = await _storage.read(key: _accessKey);
    final String? refresh = await _storage.read(key: _refreshKey);
    if (access == null || refresh == null) return null;
    final String? expires = await _storage.read(key: _expiresKey);
    return SessionTokens(
      accessToken: access,
      refreshToken: refresh,
      expiresInSeconds: int.tryParse(expires ?? '') ?? 0,
    );
  }

  @override
  Future<void> write(SessionTokens tokens) async {
    await _storage.write(key: _accessKey, value: tokens.accessToken);
    await _storage.write(key: _refreshKey, value: tokens.refreshToken);
    await _storage.write(
      key: _expiresKey,
      value: tokens.expiresInSeconds.toString(),
    );
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
    await _storage.delete(key: _expiresKey);
  }
}

/// An in-memory store for tests and for platforms where secure storage is not
/// available: it keeps nothing across a restart.
class InMemoryTokenStore implements TokenStore {
  SessionTokens? _tokens;

  @override
  Future<SessionTokens?> read() async => _tokens;

  @override
  Future<void> write(SessionTokens tokens) async => _tokens = tokens;

  @override
  Future<void> clear() async => _tokens = null;
}
