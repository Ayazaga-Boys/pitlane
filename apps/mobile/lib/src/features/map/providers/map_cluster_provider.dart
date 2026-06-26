import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_cluster_manager_2/google_maps_cluster_manager_2.dart'
    as gmc;
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../providers/map_pins_provider.dart';

// ─── Cluster item wrapper ─────────────────────────────────────────────────────

class MapPinClusterItem implements gmc.ClusterItem {
  const MapPinClusterItem(this.pin);
  final MapPin pin;

  @override
  LatLng get location => pin.position;

  @override
  String get geohash => '${pin.position.latitude}_${pin.position.longitude}';
}

// ─── Cluster marker builder ───────────────────────────────────────────────────

Future<Marker> buildClusterMarker(
  gmc.Cluster<MapPinClusterItem> cluster,
) async {
  if (cluster.count == 1) {
    final pin = cluster.items.first.pin;
    return Marker(
      markerId: MarkerId(pin.id),
      position: pin.position,
      icon: BitmapDescriptor.defaultMarkerWithHue(pinHue(pin.type)),
      infoWindow: InfoWindow(title: pin.title, snippet: pin.subtitle),
    );
  }

  final icon = await _clusterBitmap(label: '${cluster.count}');
  return Marker(
    markerId: MarkerId('cluster_${cluster.getId()}'),
    position: cluster.location,
    icon: icon,
    infoWindow: InfoWindow(title: '${cluster.count} pin'),
  );
}

Future<BitmapDescriptor> _clusterBitmap({required String label}) async {
  const size = 56.0;
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);

  final fill = Paint()
    ..color = const Color(0xFFD32F2F)
    ..style = PaintingStyle.fill;
  canvas.drawCircle(const Offset(size / 2, size / 2), size / 2, fill);

  final border = Paint()
    ..color = Colors.white
    ..style = PaintingStyle.stroke
    ..strokeWidth = 3;
  canvas.drawCircle(const Offset(size / 2, size / 2), size / 2 - 1.5, border);

  final tp = TextPainter(
    text: TextSpan(
      text: label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    ),
    textDirection: TextDirection.ltr,
  )..layout();
  tp.paint(canvas, Offset((size - tp.width) / 2, (size - tp.height) / 2));

  final image = await recorder.endRecording().toImage(
        size.toInt(),
        size.toInt(),
      );
  final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
  return BitmapDescriptor.bytes(bytes!.buffer.asUint8List());
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/// ClusterManager instance'ı pin listesiyle birlikte döner.
/// Map screen'de markers callback setlenir: manager.updateClusterManagerState()
final clusterManagerProvider =
    Provider.family<gmc.ClusterManager<MapPinClusterItem>, List<MapPin>>((
  ref,
  pins,
) {
  final items = pins.map(MapPinClusterItem.new).toList();
  return gmc.ClusterManager<MapPinClusterItem>(
    items,
    (_) {}, // map screen override eder
    markerBuilder: buildClusterMarker,
  );
});
