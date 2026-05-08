import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/theme/app_colors.dart';
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

// ─── Mock data (Erol'un endpointleri hazır olunca replace edilecek) ──────────

const _mockPins = [
  MapPin(
    id: 'flare-1',
    type: MapPinType.flare,
    title: 'Taksim Cruise Buluşması',
    subtitle: 'Bugün 20:00',
    position: LatLng(41.0369, 28.9850),
  ),
  MapPin(
    id: 'flare-2',
    type: MapPinType.flare,
    title: 'Boğaz Turu',
    subtitle: 'Yarın 10:00',
    position: LatLng(41.0550, 29.0300),
  ),
  MapPin(
    id: 'help-1',
    type: MapPinType.help,
    title: 'Akü bitti, yardım!',
    subtitle: 'Kadıköy',
    position: LatLng(40.9900, 29.0230),
  ),
  MapPin(
    id: 'business-1',
    type: MapPinType.business,
    title: 'Oto Merkezi Şişli',
    subtitle: 'Servis • Doğrulanmış',
    position: LatLng(41.0600, 28.9870),
  ),
  MapPin(
    id: 'business-2',
    type: MapPinType.business,
    title: 'Motosiklet Garajı',
    subtitle: 'Parça & Bakım',
    position: LatLng(41.0150, 28.9500),
  ),
];

// ─── Provider ───────────────────────────────────────────────────────────────

final mapPinsProvider = Provider.family<Set<Marker>, MapFilters>((ref, f) {
  final filters = f;
  final filtered = _mockPins.where((pin) {
    if (filters.pin == PinFilter.all) return true;
    if (filters.pin == PinFilter.flare    && pin.type == MapPinType.flare)    return true;
    if (filters.pin == PinFilter.help     && pin.type == MapPinType.help)     return true;
    if (filters.pin == PinFilter.business && pin.type == MapPinType.business) return true;
    return false;
  });

  return filtered.map((pin) => _buildMarker(pin)).toSet();
});

Marker _buildMarker(MapPin pin) {
  final hue = switch (pin.type) {
    MapPinType.flare    => BitmapDescriptor.hueOrange,
    MapPinType.help     => BitmapDescriptor.hueRed,
    MapPinType.business => BitmapDescriptor.hueAzure,
  };

  return Marker(
    markerId: MarkerId(pin.id),
    position: pin.position,
    icon: BitmapDescriptor.defaultMarkerWithHue(hue),
    infoWindow: InfoWindow(
      title: pin.title,
      snippet: pin.subtitle,
    ),
  );
}
