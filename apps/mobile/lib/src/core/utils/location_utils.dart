// Kural 1: Ham GPS asla backend'e gönderilmez — H3 hücresine çevrilir.

import 'package:h3_dart/h3_dart.dart';
import '../constants/h3_constants.dart';

final _h3 = H3();

/// Lat/lng → H3 hücre ID
String toH3Cell(double lat, double lng, {int resolution = H3Constants.proximityResolution}) {
  return _h3.geoToH3(GeoCoord(lat: lat, lng: lng), resolution);
}

/// H3 hücresinin merkez koordinatı (harita pini için)
GeoCoord h3CellCenter(String h3Cell) {
  return _h3.h3ToGeo(h3Cell);
}

/// H3 hücresinin sınır koordinatları (polygon overlay için)
List<GeoCoord> h3CellBoundary(String h3Cell) {
  return _h3.h3ToGeoBoundary(h3Cell);
}

/// k-ring — verilen hücrenin çevresindeki hücreler
List<String> kRing(String h3Cell, int k) {
  return _h3.kRing(h3Cell, k);
}

/// res-9 → res-8 parent hücre (heatmap için)
String toParentCell(String h3Cell9) {
  return _h3.h3ToParent(h3Cell9, H3Constants.heatmapResolution);
}
