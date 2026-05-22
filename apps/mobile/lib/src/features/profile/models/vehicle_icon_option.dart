import 'package:flutter/material.dart';

import 'vehicle.dart';

class VehicleIconOption {
  const VehicleIconOption({
    required this.slug,
    required this.label,
    required this.type,
    required this.icon,
    this.previewAsset,
  });

  final String slug;
  final String label;
  final VehicleType type;
  final IconData icon;
  final String? previewAsset;
}

abstract final class VehicleIconCatalog {
  static const xceedTestCrossover = VehicleIconOption(
    slug: 'compact_crossover_green_01',
    label: 'XCeed test crossover',
    type: VehicleType.car,
    icon: Icons.directions_car_filled_outlined,
    previewAsset:
        'assets/vehicle_icons/compact_crossover_green_01/angle_000.png',
  );

  static const sportHatch = VehicleIconOption(
    slug: 'sport_hatch_01',
    label: 'Sport hatchback',
    type: VehicleType.car,
    icon: Icons.directions_car_outlined,
  );

  static const sedan = VehicleIconOption(
    slug: 'sedan_01',
    label: 'Sedan',
    type: VehicleType.car,
    icon: Icons.local_taxi_outlined,
  );

  static const nakedBike = VehicleIconOption(
    slug: 'naked_motorcycle_01',
    label: 'Naked motor',
    type: VehicleType.motorcycle,
    icon: Icons.two_wheeler_outlined,
  );

  static const touringBike = VehicleIconOption(
    slug: 'touring_motorcycle_01',
    label: 'Touring motor',
    type: VehicleType.motorcycle,
    icon: Icons.motorcycle_outlined,
  );

  static const other = VehicleIconOption(
    slug: 'generic_vehicle_01',
    label: 'Genel araç',
    type: VehicleType.other,
    icon: Icons.garage_outlined,
  );

  static const options = [
    xceedTestCrossover,
    sportHatch,
    sedan,
    nakedBike,
    touringBike,
    other,
  ];

  static List<VehicleIconOption> optionsFor(VehicleType type) {
    final filtered = options
        .where((option) => option.type == type)
        .toList(growable: false);
    return filtered.isEmpty ? const [other] : filtered;
  }

  static VehicleIconOption resolve(String? slug, VehicleType type) {
    for (final option in options) {
      if (option.slug == slug) return option;
    }
    return optionsFor(type).first;
  }
}
