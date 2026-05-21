import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/constants/h3_constants.dart';
import '../../../core/utils/location_utils.dart';
import '../data/ws_service.dart';
import 'location_sharing_provider.dart';

const int kLocationDistanceFilterMeters = 30;

class LocationNotifier extends AsyncNotifier<String?> {
  StreamSubscription<Position>? _positionSub;
  String? _subscribedCell;

  @override
  Future<String?> build() async {
    ref.onDispose(() => _positionSub?.cancel());
    return null;
  }

  Future<void> startTracking() async {
    // Auth bypass modunda da çalışır
    if (_positionSub != null) return; // Zaten çalışıyor

    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: kLocationDistanceFilterMeters,
    );

    _positionSub = Geolocator.getPositionStream(locationSettings: settings)
        .listen((position) {
      final cell = toH3Cell(
        position.latitude,
        position.longitude,
        resolution: H3Constants.proximityResolution,
      );
      state = AsyncData(cell);
      final ws = ref.read(wsServiceProvider);
      if (ref.read(locationSharingProvider)) {
        ws.sendLocation(cell);
      }
      if (_subscribedCell != cell) {
        if (_subscribedCell != null) {
          ws.unsubscribeCell(_subscribedCell!);
        }
        ws.subscribeCell(cell, k: H3Constants.helpKRing);
        _subscribedCell = cell;
      }
    }, onError: (_) {
      // Konum alınamazsa sessizce geç
    });
  }

  void stopTracking() {
    _positionSub?.cancel();
    _positionSub = null;
    final ws = ref.read(wsServiceProvider);
    if (_subscribedCell != null) {
      ws.unsubscribeCell(_subscribedCell!);
      _subscribedCell = null;
    }
    ws.sendGhostOn();
    state = const AsyncData(null);
  }
}

final locationProvider = AsyncNotifierProvider<LocationNotifier, String?>(
  LocationNotifier.new,
);

/// Heatmap verisi (WS'den gelir — WS bağlantısı yoksa boş map döner)
final heatmapProvider = StreamProvider<Map<String, int>>((ref) {
  return ref.watch(wsServiceProvider).heatmapStream.handleError((_) {});
});
