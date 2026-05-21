import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

enum VehicleIconSlug {
  car('car'),
  motorcycle('motorcycle'),
  chopper('chopper'),
  pickup('pickup'),
  suv('suv'),
  van('van'),
  classic('classic'),
  other('other');

  const VehicleIconSlug(this.value);

  final String value;

  static VehicleIconSlug fromValue(String? value) {
    return VehicleIconSlug.values.firstWhere(
      (slug) => slug.value == value,
      orElse: () => VehicleIconSlug.other,
    );
  }
}

class VehicleIconCatalogEntry {
  const VehicleIconCatalogEntry({
    required this.slug,
    required this.label,
  });

  final VehicleIconSlug slug;
  final String label;
}

const localVehicleIconCatalog = [
  VehicleIconCatalogEntry(slug: VehicleIconSlug.car, label: 'Otomobil'),
  VehicleIconCatalogEntry(
      slug: VehicleIconSlug.motorcycle, label: 'Motosiklet'),
  VehicleIconCatalogEntry(slug: VehicleIconSlug.chopper, label: 'Chopper'),
  VehicleIconCatalogEntry(slug: VehicleIconSlug.pickup, label: 'Pickup'),
  VehicleIconCatalogEntry(slug: VehicleIconSlug.suv, label: 'SUV'),
  VehicleIconCatalogEntry(slug: VehicleIconSlug.van, label: 'Van'),
  VehicleIconCatalogEntry(slug: VehicleIconSlug.classic, label: 'Klasik'),
  VehicleIconCatalogEntry(slug: VehicleIconSlug.other, label: 'Diğer'),
];

class VehicleMarkerIconCache {
  final _cache = <String, BitmapDescriptor>{};

  Future<BitmapDescriptor> getIcon(
    VehicleIconSlug slug, {
    bool isSelf = false,
  }) async {
    final key = '${slug.value}:$isSelf';
    final cached = _cache[key];
    if (cached != null) return cached;

    final descriptor = await _buildIcon(slug, isSelf: isSelf);
    _cache[key] = descriptor;
    return descriptor;
  }

  Future<BitmapDescriptor> _buildIcon(
    VehicleIconSlug slug, {
    required bool isSelf,
  }) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    const size = 96.0;
    const center = Offset(size / 2, size / 2);
    final fill = _colorFor(slug);
    final outline = isSelf ? const Color(0xFF2D9CDB) : Colors.white;

    final bgPaint = Paint()..color = fill;
    canvas.drawCircle(center, 36, bgPaint);
    canvas.drawCircle(
      center,
      39,
      Paint()
        ..color = outline
        ..style = PaintingStyle.stroke
        ..strokeWidth = isSelf ? 6 : 4,
    );

    final icon = _iconFor(slug);
    final builder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: 42,
        fontFamily: 'MaterialIcons',
      ),
    )
      ..pushStyle(ui.TextStyle(color: Colors.white))
      ..addText(String.fromCharCode(icon.codePoint));
    final paragraph = builder.build()
      ..layout(const ui.ParagraphConstraints(width: size));
    canvas.drawParagraph(paragraph, const Offset(0, 27));

    final image = await recorder.endRecording().toImage(
          size.toInt(),
          size.toInt(),
        );
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      width: size,
      height: size,
    );
  }

  Color _colorFor(VehicleIconSlug slug) => switch (slug) {
        VehicleIconSlug.motorcycle ||
        VehicleIconSlug.chopper =>
          const Color(0xFFE63946),
        VehicleIconSlug.pickup ||
        VehicleIconSlug.suv =>
          const Color(0xFF457B9D),
        VehicleIconSlug.van => const Color(0xFF2A9D8F),
        VehicleIconSlug.classic => const Color(0xFFE9A227),
        VehicleIconSlug.car => const Color(0xFF1D3557),
        VehicleIconSlug.other => const Color(0xFF6C757D),
      };

  IconData _iconFor(VehicleIconSlug slug) => switch (slug) {
        VehicleIconSlug.motorcycle ||
        VehicleIconSlug.chopper =>
          Icons.two_wheeler,
        VehicleIconSlug.pickup ||
        VehicleIconSlug.suv ||
        VehicleIconSlug.van =>
          Icons.local_shipping,
        VehicleIconSlug.classic => Icons.directions_car_filled_outlined,
        VehicleIconSlug.car => Icons.directions_car,
        VehicleIconSlug.other => Icons.navigation,
      };
}

final vehicleMarkerIconCacheProvider = Provider<VehicleMarkerIconCache>((ref) {
  return VehicleMarkerIconCache();
});
