// Kural 1: Ham GPS asla backend'e gönderilmez — H3 hücresine çevrilir.

import 'package:h3_dart/h3_dart.dart';
import '../constants/h3_constants.dart';

final _h3 = const H3Factory().process();

/// Lat/lng → H3 hücre ID
String toH3Cell(
  double lat,
  double lng, {
  int resolution = H3Constants.proximityResolution,
}) {
  return _formatH3Index(
      _h3.geoToCell(GeoCoord(lat: lat, lon: lng), resolution));
}

/// H3 hücresinin merkez koordinatı (harita pini için)
GeoCoord h3CellCenter(String h3Cell) {
  return _h3.cellToGeo(_parseH3Index(h3Cell));
}

/// H3 hücresinin sınır koordinatları (polygon overlay için)
List<GeoCoord> h3CellBoundary(String h3Cell) {
  return _h3.cellToBoundary(_parseH3Index(h3Cell));
}

/// k-ring — verilen hücrenin çevresindeki hücreler
List<String> kRing(String h3Cell, int k) {
  return _h3.gridDisk(_parseH3Index(h3Cell), k).map(_formatH3Index).toList();
}

/// res-9 → res-8 parent hücre (heatmap için)
String toParentCell(String h3Cell9) {
  return _formatH3Index(
    _h3.cellToParent(_parseH3Index(h3Cell9), H3Constants.heatmapResolution),
  );
}

BigInt _parseH3Index(String h3Cell) => BigInt.parse(h3Cell, radix: 16);

String _formatH3Index(BigInt h3Index) => h3Index.toRadixString(16);
