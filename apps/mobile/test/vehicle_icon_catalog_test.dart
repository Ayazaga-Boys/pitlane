import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/profile/models/vehicle.dart';
import 'package:rollpit/src/features/profile/models/vehicle_icon_option.dart';

void main() {
  const backendAllowedSlugs = {
    'motorcycle_standard',
    'motorcycle_chopper',
    'motorcycle_sport',
    'motorcycle_enduro',
    'motorcycle_scooter',
    'car_sedan',
    'car_suv',
    'car_hatchback',
    'car_pickup',
    'car_classic',
    'car_sport',
  };

  test('vehicle icon catalog uses backend accepted slugs', () {
    final slugs = VehicleIconCatalog.options.map((option) => option.slug);

    expect(slugs, everyElement(isIn(backendAllowedSlugs)));
  });

  test('vehicle type filters only expose matching icon categories', () {
    final carOptions = VehicleIconCatalog.optionsFor(VehicleType.car);
    final motorcycleOptions = VehicleIconCatalog.optionsFor(
      VehicleType.motorcycle,
    );

    expect(carOptions, isNotEmpty);
    expect(motorcycleOptions, isNotEmpty);
    expect(carOptions, everyElement(hasVehicleType(VehicleType.car)));
    expect(
      motorcycleOptions,
      everyElement(hasVehicleType(VehicleType.motorcycle)),
    );
  });
}

Matcher hasVehicleType(VehicleType type) {
  return predicate<VehicleIconOption>(
    (option) => option.type == type,
    'has vehicle type ${type.apiValue}',
  );
}
