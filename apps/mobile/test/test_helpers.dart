import 'dart:convert';

import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import 'package:nourish_mobile/core/update_launcher.dart';
import 'package:nourish_mobile/data/database.dart';
import 'package:nourish_mobile/data/models/release_metadata.dart';
import 'package:nourish_mobile/data/seed/seed_importer.dart';
import 'package:nourish_mobile/data/services/image_acquisition_service.dart';
import 'package:nourish_mobile/data/services/token_store.dart';
import 'package:nourish_mobile/data/sources/auth_api_client.dart';
import 'package:nourish_mobile/data/sources/release_metadata_source.dart';
import 'package:nourish_mobile/features/scan/photo_capture_screen.dart';
import 'package:nourish_mobile/features/update/update_controller.dart';
import 'package:nourish_mobile/providers.dart';

/// Opens an in-memory database with the seed catalog already imported.
Future<AppDatabase> openSeededDb() async {
  final AppDatabase db = AppDatabase(NativeDatabase.memory());
  await SeedImporter(db).run();
  return db;
}

/// A scripted release-metadata source: no sockets, ever.
///
/// By default it returns null, which is the "update check could not run" path —
/// so every widget test that pumps the app stays offline unless it explicitly
/// asks for a newer release.
class FakeReleaseMetadataSource implements ReleaseMetadataSource {
  FakeReleaseMetadataSource({this.metadata});

  ReleaseMetadata? metadata;
  int calls = 0;

  @override
  Future<ReleaseMetadata?> fetch() async {
    calls++;
    return metadata;
  }
}

/// Records the URLs the app would open instead of launching a browser.
class FakeUpdateLauncher implements UpdateLauncher {
  final List<String> opened = <String>[];
  bool result = true;

  @override
  Future<bool> open(String url) async {
    opened.add(url);
    return result;
  }
}

/// A scripted image picker: no platform channel is ever opened.
///
/// Defaults to "the user cancelled", which is the no-op path.
class FakeImageAcquisitionService implements ImageAcquisitionService {
  FakeImageAcquisitionService({this.photo});

  PreparedPhoto? photo;
  int calls = 0;
  MealPhotoSource? lastSource;

  @override
  Future<PreparedPhoto?> pick(MealPhotoSource source) async {
    calls++;
    lastSource = source;
    return photo;
  }
}

/// One recorded request, so a test can assert what the app actually sent.
class RecordedRequest {
  RecordedRequest({
    required this.method,
    required this.path,
    required this.headers,
    this.body,
  });

  final String method;
  final String path;
  final Map<String, String> headers;
  final Map<String, dynamic>? body;
}

/// One scripted reply: a status and either a JSON-encodable body or a raw one.
class FakeReply {
  const FakeReply(this.statusCode, [this.body]);

  final int statusCode;
  final Object? body;
}

/// Answers one request. Returning null falls through to the default reply.
typedef FakeRoute =
    FakeReply? Function(String path, Map<String, dynamic>? body, Map<String, String> headers);

/// A scripted HTTP client: no socket is ever opened, and the response can be
/// whatever the test needs (a real envelope, a malformed body, or a failure).
///
/// Pass [router] when different paths need different answers (the sign-in flow
/// has several); otherwise every request gets [statusCode] and [body].
class FakeHttpClient extends http.BaseClient {
  FakeHttpClient({
    this.statusCode = 200,
    Object? body,
    this.rawBody = false,
    this.throws = false,
    this.router,
  }) : body = body ?? const <String, dynamic>{};

  int statusCode;

  /// Either a JSON-encodable object or, when [rawBody] is set, the exact string.
  Object body;
  bool rawBody;

  /// When true every request fails at the transport layer.
  bool throws;

  final FakeRoute? router;

  final List<RecordedRequest> requests = <RecordedRequest>[];

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final String raw = request is http.Request ? request.body : '';
    final Map<String, dynamic>? decoded = raw.isEmpty
        ? null
        : jsonDecode(raw) as Map<String, dynamic>;
    requests.add(
      RecordedRequest(
        method: request.method,
        path: request.url.path,
        headers: request.headers,
        body: decoded,
      ),
    );
    if (throws) {
      throw http.ClientException('no network in this test');
    }

    final FakeReply? scripted = router?.call(
      request.url.path,
      decoded,
      request.headers,
    );
    final int status = scripted?.statusCode ?? statusCode;
    final Object? payload = scripted == null ? body : scripted.body;
    if (status == 204 || payload == null) {
      return http.StreamedResponse(
        const Stream<List<int>>.empty(),
        status,
        request: request,
      );
    }
    final String text = rawBody ? payload as String : jsonEncode(payload);
    return http.StreamedResponse(
      Stream<List<int>>.value(utf8.encode(text)),
      status,
      headers: <String, String>{'content-type': 'application/json'},
      request: request,
    );
  }
}

/// The overrides every pumped app needs so no test reaches the network for a
/// release document or opens a platform image picker. Tests that care about
/// those paths pass their own fakes.
List<Override> offlineUpdateOverrides({
  ReleaseMetadata? metadata,
  FakeUpdateLauncher? launcher,
  FakeImageAcquisitionService? imagePicker,
}) {
  return <Override>[
    releaseMetadataSourceProvider.overrideWithValue(
      FakeReleaseMetadataSource(metadata: metadata),
    ),
    updateLauncherProvider.overrideWithValue(launcher ?? FakeUpdateLauncher()),
    imageAcquisitionServiceProvider.overrideWithValue(
      imagePicker ?? FakeImageAcquisitionService(),
    ),
  ];
}

/// Overrides that keep sign-in off the network and out of the keychain: the
/// device starts with no session unless the test seeds one.
List<Override> offlineAuthOverrides({
  FakeHttpClient? client,
  TokenStore? tokenStore,
}) {
  return <Override>[
    authApiProvider.overrideWithValue(
      AuthApi(client: client ?? FakeHttpClient(throws: true), baseUrl: 'http://test'),
    ),
    tokenStoreProvider.overrideWithValue(tokenStore ?? InMemoryTokenStore()),
  ];
}
