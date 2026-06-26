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
  static const carSedan = VehicleIconOption(
    slug: 'car_sedan',
    label: 'Sedan',
    type: VehicleType.car,
    icon: Icons.directions_car_filled_outlined,
  );

  static const carSuv = VehicleIconOption(
    slug: 'car_suv',
    label: 'SUV',
    type: VehicleType.car,
    icon: Icons.directions_car_filled_outlined,
  );

  static const carHatchback = VehicleIconOption(
    slug: 'car_hatchback',
    label: 'Hatchback',
    type: VehicleType.car,
    icon: Icons.directions_car_outlined,
  );

  static const carPickup = VehicleIconOption(
    slug: 'car_pickup',
    label: 'Pickup',
    type: VehicleType.car,
    icon: Icons.local_shipping_outlined,
  );

  static const carClassic = VehicleIconOption(
    slug: 'car_classic',
    label: 'Klasik',
    type: VehicleType.car,
    icon: Icons.directions_car_filled_outlined,
  );

  static const carSport = VehicleIconOption(
    slug: 'car_sport',
    label: 'Spor',
    type: VehicleType.car,
    icon: Icons.sports_motorsports_outlined,
  );

  static const motorcycleStandard = VehicleIconOption(
    slug: 'motorcycle_standard',
    label: 'Standart',
    type: VehicleType.motorcycle,
    icon: Icons.two_wheeler_outlined,
  );

  static const motorcycleChopper = VehicleIconOption(
    slug: 'motorcycle_chopper',
    label: 'Chopper',
    type: VehicleType.motorcycle,
    icon: Icons.motorcycle_outlined,
  );

  static const motorcycleSport = VehicleIconOption(
    slug: 'motorcycle_sport',
    label: 'Spor',
    type: VehicleType.motorcycle,
    icon: Icons.sports_motorsports_outlined,
  );

  static const motorcycleEnduro = VehicleIconOption(
    slug: 'motorcycle_enduro',
    label: 'Enduro',
    type: VehicleType.motorcycle,
    icon: Icons.two_wheeler_outlined,
  );

  static const motorcycleScooter = VehicleIconOption(
    slug: 'motorcycle_scooter',
    label: 'Scooter',
    type: VehicleType.motorcycle,
    icon: Icons.motorcycle_outlined,
  );

  static const options = [
    carSedan,
    carSuv,
    carHatchback,
    carPickup,
    carClassic,
    carSport,
    motorcycleStandard,
    motorcycleChopper,
    motorcycleSport,
    motorcycleEnduro,
    motorcycleScooter,
  ];

  static List<VehicleIconOption> optionsFor(VehicleType type) {
    final filtered =
        options.where((option) => option.type == type).toList(growable: false);
    return filtered.isEmpty ? const [carSedan] : filtered;
  }

  static VehicleIconOption resolve(String? slug, VehicleType type) {
    for (final option in options) {
      if (option.slug == slug) return option;
    }
    return optionsFor(type).first;
  }
}
