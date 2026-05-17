import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/constants/h3_constants.dart';
import '../../../core/utils/location_utils.dart';
import '../providers/location_provider.dart';
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
    this.peerId,
  });

  final String id;
  final MapPinType type;
  final String title;
  final LatLng position;
  final String? subtitle;
  final String? peerId;
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
      if (AppConstants.isDev) 'x-dev-user-email': 'dev@rollpit.test',
    },
  ));
});

// ─── Pins repository ─────────────────────────────────────────────────────────

// H3 hücresi → koordinat. Simulator'da h3_ffi yüklenemiyorsa İstanbul merkezine düşer.
// Simulator'da h3_ffi yüklenemiyor — bilinen hücreler için sabit koordinat.
// Gerçek cihazda h3CellCenter() kullanılır.
const _knownCells = <String, LatLng>{
  // Avrupa Yakası
  '89283082803ffff': LatLng(41.0369, 28.9850), // Taksim
  '8928308280fffff': LatLng(41.0785, 28.9784), // Maslak
  '892830828c3ffff': LatLng(41.0082, 28.9784), // Sultanahmet
  '8928308283bffff': LatLng(41.0600, 29.0000), // Şişli
  '89283082817ffff': LatLng(41.0150, 28.9500), // Beşiktaş
  '8928308281fffff': LatLng(41.0550, 28.9700), // Mecidiyeköy
  '89283082807ffff': LatLng(40.9800, 28.8700), // Bağcılar
  '8928308282fffff': LatLng(41.0300, 28.9100), // Eyüp
  // Anadolu Yakası
  '8928308280bffff': LatLng(40.9900, 29.0230), // Kadıköy
  '89283082883ffff': LatLng(40.9700, 29.1000), // Maltepe
  '89283082887ffff': LatLng(40.9400, 29.0900), // Kartal
  '8928308288bffff': LatLng(41.0200, 29.1300), // Üsküdar
  '89283082893ffff': LatLng(41.1000, 29.0500), // Beykoz
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

const _fallbackMapH3Cell = '89283082803ffff';

Map<String, Object> _mapQuery(String h3Cell, int k) => {
      'h3cell': h3Cell,
      'k': k,
    };

Future<List<MapPin>> _fetchBusinessPins(Dio dio, String h3Cell) async {
  final res = await dio.get<Map<String, dynamic>>(
    '/map/pins',
    queryParameters: _mapQuery(h3Cell, H3Constants.businessPinKRing),
  );
  final items = (res.data?['data'] as List<dynamic>?) ?? [];
  return items.map((dynamic raw) {
    final item = raw as Map<String, dynamic>;
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

String? _formatDate(String? iso) {
  if (iso == null) return null;
  try {
    final dt = DateTime.parse(iso).toLocal();
    final months = [
      'Oca',
      'Şub',
      'Mar',
      'Nis',
      'May',
      'Haz',
      'Tem',
      'Ağu',
      'Eyl',
      'Eki',
      'Kas',
      'Ara'
    ];
    return '${dt.day} ${months[dt.month - 1]} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}

Future<List<MapPin>> _fetchHelpPins(Dio dio, String h3Cell) async {
  final res = await dio.get<Map<String, dynamic>>(
    '/map/help',
    queryParameters: _mapQuery(h3Cell, H3Constants.helpKRing),
  );
  final items = (res.data?['data'] as List<dynamic>?) ?? [];
  return items.map((dynamic raw) {
    final item = raw as Map<String, dynamic>;
    final h3Cell = item['h3_cell'] as String? ?? '';
    final issueType = item['issue_type'] as String? ?? 'other';
    return MapPin(
      id: item['id'] as String,
      type: MapPinType.help,
      title: _issueTypeLabel(issueType),
      subtitle: item['description'] as String?,
      position: _h3ToLatLng(h3Cell),
      peerId: item['requester_id'] as String?,
    );
  }).toList();
}

String _issueTypeLabel(String type) => switch (type) {
      'breakdown' => '🔧 Arıza',
      'flat_tire' => '🛞 Lastik Patladı',
      'fuel' => '⛽ Yakıt Bitti',
      'accident' => '⚠️ Kaza',
      _ => '🆘 Yardım',
    };

Future<List<MapPin>> _fetchFlarePins(Dio dio, String h3Cell) async {
  final res = await dio.get<Map<String, dynamic>>(
    '/map/flares',
    queryParameters: _mapQuery(h3Cell, H3Constants.flareKRing),
  );
  final items = (res.data?['data'] as List<dynamic>?) ?? [];
  return items.map((dynamic raw) {
    final item = raw as Map<String, dynamic>;
    final h3Cell = item['h3_cell'] as String? ?? '';
    return MapPin(
      id: item['id'] as String,
      type: MapPinType.flare,
      title: item['title'] as String? ?? '',
      subtitle: _formatDate(item['starts_at'] as String?),
      position: _h3ToLatLng(h3Cell),
    );
  }).toList();
}

// ─── Provider — gerçek API + filtre ──────────────────────────────────────────

final allPinsProvider = FutureProvider<List<MapPin>>((ref) async {
  debugPrint('[MapPins] fetching from API: ${AppConstants.apiBaseUrl}');
  final dio = ref.read(_dioProvider);
  // Kullanıcının anlık h3 hücresi — map endpoint'leri buna göre filtrelenir.
  final userH3Cell = ref.watch(locationProvider).valueOrNull;
  final mapH3Cell = userH3Cell ?? _fallbackMapH3Cell;
  try {
    final pins = await _fetchBusinessPins(dio, mapH3Cell);
    debugPrint('[MapPins] pins loaded: ${pins.length}');
    List<MapPin> flares = [];
    try {
      flares = await _fetchFlarePins(dio, mapH3Cell);
      debugPrint('[MapPins] flares loaded: ${flares.length}');
    } catch (e) {
      debugPrint('[MapPins] flares error: $e');
    }
    List<MapPin> helpPins = [];
    try {
      helpPins = await _fetchHelpPins(dio, mapH3Cell);
      debugPrint('[MapPins] help loaded: ${helpPins.length}');
    } catch (e) {
      debugPrint('[MapPins] help error: $e');
    }
    return [...pins, ...flares, ...helpPins];
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
