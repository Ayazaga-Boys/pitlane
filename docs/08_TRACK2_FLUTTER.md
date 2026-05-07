# 08 — Track 2: Flutter

---

## Klasör Yapısı

```
apps/mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart                        # MaterialApp + GoRouter + ProviderScope
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_constants.dart      # API URL, WS URL
│   │   │   ├── h3_constants.dart       # kH3ResHeatmap, kH3ResProximity
│   │   │   └── map_constants.dart      # kDefaultZoom, kMaxClusterZoom
│   │   ├── errors/
│   │   │   ├── app_exception.dart
│   │   │   └── failure.dart
│   │   ├── extensions/
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── app_colors.dart
│   │   │   └── app_text_styles.dart
│   │   └── utils/
│   │       ├── location_utils.dart     # toH3Cell()
│   │       └── media_utils.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   └── auth_repository.dart
│   │   │   ├── providers/
│   │   │   │   └── auth_provider.dart
│   │   │   └── ui/
│   │   │       ├── login_screen.dart
│   │   │       ├── register_screen.dart
│   │   │       └── otp_screen.dart
│   │   ├── map/
│   │   │   ├── data/
│   │   │   │   ├── map_repository.dart
│   │   │   │   └── ws_service.dart     # Go WebSocket
│   │   │   ├── models/
│   │   │   │   ├── h3_cell.dart
│   │   │   │   └── map_pin.dart
│   │   │   ├── providers/
│   │   │   │   ├── heatmap_provider.dart
│   │   │   │   ├── location_provider.dart
│   │   │   │   └── map_pins_provider.dart
│   │   │   └── ui/
│   │   │       ├── map_screen.dart
│   │   │       └── widgets/
│   │   │           ├── heatmap_overlay.dart
│   │   │           └── pin_card.dart
│   │   ├── communities/
│   │   ├── flares/
│   │   ├── messaging/
│   │   ├── help/
│   │   ├── camera/
│   │   ├── profile/
│   │   └── notifications/
│   └── shared/
│       ├── widgets/
│       │   ├── pitlane_button.dart
│       │   ├── pitlane_avatar.dart
│       │   └── loading_indicator.dart
│       └── providers/
│           └── supabase_provider.dart
├── test/
│   ├── unit/
│   └── widget/
├── integration_test/
├── pubspec.yaml
└── analysis_options.yaml
```

---

## pubspec.yaml (Kritik Bağımlılıklar)

```yaml
name: pitlane
description: Pitlane — Car & Moto Social
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: '>=3.22.0'

dependencies:
  flutter:
    sdk: flutter

  # State & Navigation
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  go_router: ^14.0.0

  # Supabase
  supabase_flutter: ^2.5.0

  # Harita & Konum
  google_maps_flutter: ^2.6.0
  h3_dart: ^4.0.0
  geolocator: ^12.0.0

  # HTTP & Realtime
  dio: ^5.4.0
  web_socket_channel: ^3.0.0

  # Serialization
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

  # Storage
  flutter_secure_storage: ^9.0.0

  # Media
  image_picker: ^1.1.0
  flutter_image_compress: ^2.3.0
  video_compress: ^3.1.0
  cached_network_image: ^3.3.1
  camera: ^0.11.0
  video_player: ^2.9.0

  # Notifications
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0

  # Permissions
  permission_handler: ^11.3.0

  # Utils
  intl: ^0.19.0
  uuid: ^4.4.0
  package_info_plus: ^8.0.0
  connectivity_plus: ^6.0.0
  url_launcher: ^6.3.0
  share_plus: ^10.0.0

  # Lokalizasyon
  flutter_localizations:
    sdk: flutter

  # Monitoring
  sentry_flutter: ^8.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  riverpod_generator: ^2.4.0
  build_runner: ^2.4.0
  freezed: ^2.5.0
  json_serializable: ^6.8.0
  go_router_builder: ^2.7.0
  flutter_lints: ^4.0.0
  mocktail: ^1.0.0
  patrol: ^3.0.0
  flutter_native_splash: ^2.4.0
  flutter_launcher_icons: ^0.13.0
```

---

## GoRouter Konfigürasyonu

```dart
// lib/app.dart
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/map',
    redirect: (context, state) {
      final isLoggedIn = authState.valueOrNull != null;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isLoggedIn && !isAuthRoute) return '/auth/login';
      if (isLoggedIn && isAuthRoute) return '/map';
      return null;
    },
    routes: [
      GoRoute(path: '/auth/login',    builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/auth/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/auth/otp',      builder: (_, __) => const OtpScreen()),
      ShellRoute(
        builder: (_, __, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/map',        builder: (_, __) => const MapScreen()),
          GoRoute(path: '/communities',builder: (_, __) => const CommunitiesScreen()),
          GoRoute(path: '/communities/:id', builder: (_, s) => CommunityDetailScreen(id: s.pathParameters['id']!)),
          GoRoute(path: '/flares/:id', builder: (_, s) => FlareDetailScreen(id: s.pathParameters['id']!)),
          GoRoute(path: '/messages',   builder: (_, __) => const MessagesScreen()),
          GoRoute(path: '/messages/:peerId', builder: (_, s) => ChatScreen(peerId: s.pathParameters['peerId']!)),
          GoRoute(path: '/profile',    builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/profile/:username', builder: (_, s) => PublicProfileScreen(username: s.pathParameters['username']!)),
          GoRoute(path: '/help',       builder: (_, __) => const HelpScreen()),
          GoRoute(path: '/camera',     builder: (_, __) => const CameraScreen()),
          GoRoute(path: '/settings',   builder: (_, __) => const SettingsScreen()),
        ],
      ),
    ],
  );
}
```

---

## Auth Provider

```dart
// lib/features/auth/providers/auth_provider.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

part 'auth_provider.g.dart';

@riverpod
Stream<AuthState> authState(AuthStateRef ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
}

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<User?> build() {
    return AsyncData(Supabase.instance.client.auth.currentUser);
  }

  Future<void> signInWithEmail(String email) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await Supabase.instance.client.auth.signInWithOtp(email: email);
      return Supabase.instance.client.auth.currentUser;
    });
  }

  Future<void> verifyOtp(String email, String token) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final res = await Supabase.instance.client.auth.verifyOTP(
        email: email,
        token: token,
        type: OtpType.email,
      );
      return res.user;
    });
  }

  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    state = const AsyncData(null);
  }
}
```

---

## Location Provider (Konum + WebSocket)

```dart
// lib/features/map/providers/location_provider.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:pitlane/core/constants/h3_constants.dart';
import 'package:pitlane/core/utils/location_utils.dart';

part 'location_provider.g.dart';

@riverpod
class LocationNotifier extends _$LocationNotifier {
  StreamSubscription<Position>? _positionSub;

  @override
  AsyncValue<String?> build() {
    ref.onDispose(() => _positionSub?.cancel());
    return const AsyncData(null); // h3Cell
  }

  Future<void> startTracking() async {
    final isGhost = ref.read(profileProvider).valueOrNull?.ghostMode ?? false;
    if (isGhost) return;

    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: kLocationDistanceFilterMeters, // sabit: 30
    );

    _positionSub = Geolocator.getPositionStream(locationSettings: settings)
        .listen((position) {
      final cell = toH3Cell(position.latitude, position.longitude);
      state = AsyncData(cell);
      ref.read(wsServiceProvider).sendLocation(cell);
    });
  }

  void stopTracking() {
    _positionSub?.cancel();
    ref.read(wsServiceProvider).clearLocation();
    state = const AsyncData(null);
  }
}
```

---

## WebSocket Servisi

```dart
// lib/features/map/data/ws_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:pitlane/core/constants/app_constants.dart';

class WsService {
  WebSocketChannel? _channel;
  StreamSubscription? _sub;

  void connect(String jwtToken) {
    _channel = WebSocketChannel.connect(
      Uri.parse('${AppConstants.wsBaseUrl}/ws/location?token=$jwtToken'),
    );
    _sub = _channel!.stream.listen(
      _handleMessage,
      onDone: _onDisconnect,
      onError: (_) => _scheduleReconnect(),
    );
  }

  void sendLocation(String h3Cell) {
    _channel?.sink.add(jsonEncode({'type': 'location', 'h3_cell': h3Cell}));
  }

  void clearLocation() {
    _channel?.sink.add(jsonEncode({'type': 'ghost_on'}));
  }

  void _handleMessage(dynamic raw) {
    final msg = jsonDecode(raw as String) as Map<String, dynamic>;
    // Heatmap güncellemeleri vb. Riverpod provider'larına yönlendir
  }

  void _onDisconnect() => _scheduleReconnect();

  void _scheduleReconnect() {
    Future.delayed(const Duration(seconds: 3), () {
      final token = /* secure storage'dan oku */ '';
      connect(token);
    });
  }

  void dispose() {
    _sub?.cancel();
    _channel?.sink.close();
  }
}
```

---

## Heatmap Overlay

```dart
// lib/features/map/ui/widgets/heatmap_overlay.dart
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:h3_dart/h3_dart.dart';

class HeatmapOverlay extends StatelessWidget {
  final List<H3CellCount> cells; // {h3Cell, count}
  const HeatmapOverlay({super.key, required this.cells});

  @override
  Widget build(BuildContext context) {
    final polygons = cells.map((c) {
      final boundary = H3().h3ToGeoBoundary(c.h3Cell);
      final latLngs = boundary.map((g) => LatLng(g.lat, g.lng)).toList();
      final intensity = (c.count / kHeatmapMaxCount).clamp(0.0, 1.0);
      return Polygon(
        polygonId: PolygonId(c.h3Cell),
        points: latLngs,
        fillColor: _heatColor(intensity).withOpacity(0.45),
        strokeWidth: 0,
      );
    }).toSet();

    return Stack(children: [
      // Bu widget MapScreen'in GoogleMap widget'ına polygon seti olarak geçirilir.
      // Burada sadece mantık gösterimi var.
      const SizedBox.shrink(),
    ]);
  }

  Color _heatColor(double intensity) {
    // Soğuk (mavi) → ılık (sarı) → sıcak (kırmızı)
    if (intensity < 0.5) return Color.lerp(Colors.blue, Colors.yellow, intensity * 2)!;
    return Color.lerp(Colors.yellow, Colors.red, (intensity - 0.5) * 2)!;
  }
}
```

---

## Tema Sistemi

```dart
// lib/core/theme/app_colors.dart
class AppColors {
  static const primary   = Color(0xFFE63946);  // Pitlane kırmızı
  static const surface   = Color(0xFF1A1A2E);  // Koyu lacivert
  static const card      = Color(0xFF16213E);
  static const accent    = Color(0xFF0F3460);
  static const textPrimary   = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFFB0B0B0);
  static const success   = Color(0xFF06D6A0);
  static const warning   = Color(0xFFFFB703);
  static const error     = Color(0xFFEF476F);
}

// lib/core/theme/app_theme.dart
class AppTheme {
  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      surface: AppColors.surface,
      error: AppColors.error,
    ),
    scaffoldBackgroundColor: AppColors.surface,
    cardColor: AppColors.card,
    useMaterial3: true,
  );
}
```

---

## Kod Kalite Kuralları (analysis_options.yaml)

```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    avoid_print: true
    prefer_const_constructors: true
    prefer_const_declarations: true
    avoid_unnecessary_containers: true
    use_key_in_widget_constructors: true

analyzer:
  errors:
    missing_required_param: error
    missing_return: error
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
```

---

## Performans Bütçesi

| Metrik | Hedef |
|---|---|
| İlk harita frame | < 1.2 sn |
| Harita polygon render (200 hücre) | < 16 ms (60 fps) |
| App başlatma süresi (cold start) | < 2.5 sn |
| Bellek kullanımı (normal kullanım) | < 180 MB |
| Medya yükleme (5 MB fotoğraf) | < 4 sn |