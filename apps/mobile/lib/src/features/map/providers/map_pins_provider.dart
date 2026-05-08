import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/utils/location_utils.dart';
import '../ui/map_filter_sheet.dart';

// ─── Model ──────────────────────────────────────────────────────────────────

enum MapPinType { flare, help, business }

class MapPin {
  const MapPin({
    required this.id,
    required this.type,
    required this.title,
    required this.position,
    this.subtitle,
  });

  final String id;
  final MapPinType type;
  final String title;
  final LatLng position;
  final String? subtitle;
}

// ─── HTTP client ─────────────────────────────────────────────────────────────

final _dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: '${AppConstants.apiBaseUrl}/v1',
    connectTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
    receiveTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
    headers: {
      'Content-Type': 'application/json',
      // Dev bypass — Resend + domain hazır olunca Supabase token ile değişir
      if (AppConstants.isDev) 'x-dev-user-id': 'dev-user-map',
      if (AppConstants.isDev) 'x-dev-user-email': 'dev@pitlane.test',
    },
  ));
});

// ─── Pins repository ─────────────────────────────────────────────────────────

// H3 hücresi → koordinat. Simulator'da h3_ffi yüklenemiyorsa İstanbul merkezine düşer.
// Simulator'da h3_ffi yüklenemiyor — bilinen hücreler için sabit koordinat.
// Gerçek cihazda h3CellCenter() kullanılır.
const _knownCells = <String, LatLng>{
  '8928308280fffff': LatLng(41.0369, 28.9850), // Taksim (test)
  '89283082803ffff': LatLng(41.0369, 28.9850), // Taksim
  '8928308280bffff': LatLng(40.9900, 29.0230), // Kadıköy
};

LatLng _h3ToLatLng(String h3Cell) {
  if (h3Cell.isEmpty) return const LatLng(41.0082, 28.9784);
  final known = _knownCells[h3Cell];
  if (known != null) return known;
  try {
    final geo = h3CellCenter(h3Cell);
    return LatLng(geo.lat, geo.lon);
  } catch (_) {
    return const LatLng(41.0082, 28.9784);
  }
}

Future<List<MapPin>> _fetchBusinessPins(Dio dio) async {
  final res = await dio.get<Map<String, dynamic>>('/pins');
  final items = (res.data?['data'] as List?) ?? [];
  return items.map((item) {
    final h3Cell = item['h3_cell'] as String? ?? '';
    return MapPin(
      id: item['id'] as String,
      type: MapPinType.business,
      title: item['name'] as String? ?? '',
      subtitle: item['category'] as String?,
      position: _h3ToLatLng(h3Cell),
    );
  }).toList();
}

Future<List<MapPin>> _fetchFlarePins(Dio dio) async {
  final res = await dio.get<Map<String, dynamic>>('/flares');
  final items = (res.data?['data'] as List?) ?? [];
  return items.map((item) {
    final h3Cell = item['h3_cell'] as String? ?? '';
    return MapPin(
      id: item['id'] as String,
      type: MapPinType.flare,
      title: item['title'] as String? ?? '',
      subtitle: item['starts_at'] as String?,
      position: _h3ToLatLng(h3Cell),
    );
  }).toList();
}

// ─── Provider — gerçek API + filtre ──────────────────────────────────────────

final allPinsProvider = FutureProvider<List<MapPin>>((ref) async {
  debugPrint('[MapPins] fetching from API: ${AppConstants.apiBaseUrl}');
  final dio = ref.read(_dioProvider);
  try {
    final pins = await _fetchBusinessPins(dio);
    debugPrint('[MapPins] pins loaded: ${pins.length}');
    List<MapPin> flares = [];
    try {
      flares = await _fetchFlarePins(dio);
      debugPrint('[MapPins] flares loaded: ${flares.length}');
    } catch (e) {
      debugPrint('[MapPins] flares error: $e');
    }
    return [...pins, ...flares];
  } catch (e) {
    debugPrint('[MapPins] API error: $e');
    return [];
  }
});

final filteredPinsProvider =
    Provider.family<List<MapPin>, MapFilters>((ref, f) {
  final pins = ref.watch(allPinsProvider).valueOrNull ?? [];
  return pins.where((pin) {
    if (f.pin == PinFilter.all) return true;
    if (f.pin == PinFilter.flare && pin.type == MapPinType.flare) return true;
    if (f.pin == PinFilter.help && pin.type == MapPinType.help) return true;
    if (f.pin == PinFilter.business && pin.type == MapPinType.business) {
      return true;
    }
    return false;
  }).toList();
});

double pinHue(MapPinType type) => switch (type) {
      MapPinType.flare => BitmapDescriptor.hueOrange,
      MapPinType.help => BitmapDescriptor.hueRed,
      MapPinType.business => BitmapDescriptor.hueAzure,
    };
