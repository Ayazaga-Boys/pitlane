import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../models/push_notification.dart';

typedef PushDeepLinkMapper = String? Function(Map<String, dynamic> data);

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await FirebasePushBootstrap.ensureInitialized();
}

abstract final class FirebasePushBootstrap {
  static Future<bool>? _initialization;

  static Future<bool> ensureInitialized() {
    return _initialization ??= _initialize();
  }

  static Future<bool> _initialize() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      return true;
    } on FirebaseException {
      return false;
    } catch (_) {
      return false;
    }
  }
}

class FirebasePushService {
  FirebasePushService(this._mapDeepLink);

  final PushDeepLinkMapper _mapDeepLink;
  final _deepLinks = StreamController<String>.broadcast();

  bool _isListening = false;
  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _openedSubscription;

  Stream<String> get deepLinks => _deepLinks.stream;

  Future<DeviceRegistrationDraft?> requestDeviceRegistrationDraft() async {
    final isReady = await FirebasePushBootstrap.ensureInitialized();
    if (!isReady) return null;

    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) return null;

    return DeviceRegistrationDraft(
      platform: Platform.isIOS ? 'ios' : 'android',
      token: token,
      appBuild: 'firebase',
    );
  }

  Future<void> bind({
    required Future<void> Function(DeviceRegistrationDraft draft)
        onTokenRefresh,
  }) async {
    final isReady = await FirebasePushBootstrap.ensureInitialized();
    if (!isReady || _isListening) return;
    _isListening = true;

    _tokenRefreshSubscription =
        FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      onTokenRefresh(
        DeviceRegistrationDraft(
          platform: Platform.isIOS ? 'ios' : 'android',
          token: token,
          appBuild: 'firebase',
        ),
      );
    });

    _foregroundSubscription = FirebaseMessaging.onMessage.listen(
      _emitDeepLinkForMessage,
    );
    _openedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
      _emitDeepLinkForMessage,
    );

    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) _emitDeepLinkForMessage(initialMessage);
  }

  void dispose() {
    _tokenRefreshSubscription?.cancel();
    _foregroundSubscription?.cancel();
    _openedSubscription?.cancel();
    _deepLinks.close();
  }

  void _emitDeepLinkForMessage(RemoteMessage message) {
    final deepLink = _mapDeepLink(message.data);
    if (deepLink != null) _deepLinks.add(deepLink);
  }
}
