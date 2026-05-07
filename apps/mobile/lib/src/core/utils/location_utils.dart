// Kural 1: Ham GPS asla backend'e gönderilmez — H3 hücresine çevrilir.
// Sprint 2'de h3_dart paketi eklenince bu stub gerçek implementasyona dönüşür.

import '../constants/h3_constants.dart';

/// Lat/lng koordinatını H3 hücre ID'sine çevirir.
/// Sprint 2'de h3_dart ile replace edilecek.
String toH3Cell(double lat, double lng, {int resolution = H3Constants.proximityResolution}) {
  // TODO(sprint2): h3_dart paketi eklenince gerçek implementasyon:
  // final h3 = H3();
  // return h3.geoToH3(GeoCoord(lat: lat, lng: lng), resolution);
  throw UnimplementedError('h3_dart Sprint 2\'de eklenecek. Ham koordinat gönderme!');
}
