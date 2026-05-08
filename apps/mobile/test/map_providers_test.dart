import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pitlane/src/features/map/providers/ghost_mode_provider.dart';
import 'package:pitlane/src/features/map/providers/map_pins_provider.dart';
import 'package:pitlane/src/features/map/ui/map_filter_sheet.dart';

void main() {
  // ── filteredPinsProvider ───────────────────────────────────────────────────

  group('filteredPinsProvider', () {
    test('all filter returns all mock pins', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final pins = container.read(filteredPinsProvider(const MapFilters()));
      expect(pins.length, greaterThan(0));
    });

    test('flare filter returns only flare pins', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final pins = container.read(
        filteredPinsProvider(const MapFilters(pin: PinFilter.flare)),
      );
      expect(pins.every((p) => p.type == MapPinType.flare), isTrue);
      expect(pins, isNotEmpty);
    });

    test('help filter returns only help pins', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final pins = container.read(
        filteredPinsProvider(const MapFilters(pin: PinFilter.help)),
      );
      expect(pins.every((p) => p.type == MapPinType.help), isTrue);
    });

    test('business filter returns only business pins', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final pins = container.read(
        filteredPinsProvider(const MapFilters(pin: PinFilter.business)),
      );
      expect(pins.every((p) => p.type == MapPinType.business), isTrue);
    });

    test('same MapFilters value hits cached provider', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final f = const MapFilters(pin: PinFilter.flare);
      final pins1 = container.read(filteredPinsProvider(f));
      final pins2 = container.read(filteredPinsProvider(f));
      expect(identical(pins1, pins2), isTrue);
    });
  });

  // ── mapFiltersProvider ─────────────────────────────────────────────────────

  group('mapFiltersProvider', () {
    test('initial state is default', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(mapFiltersProvider).isDefault, isTrue);
    });

    test('setPin changes pin filter', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(mapFiltersProvider.notifier).setPin(PinFilter.flare);
      expect(container.read(mapFiltersProvider).pin, PinFilter.flare);
      expect(container.read(mapFiltersProvider).isDefault, isFalse);
    });

    test('setVehicle changes vehicle filter', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container
          .read(mapFiltersProvider.notifier)
          .setVehicle(VehicleFilter.motorcycle);
      expect(
          container.read(mapFiltersProvider).vehicle, VehicleFilter.motorcycle);
    });

    test('reset restores defaults', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(mapFiltersProvider.notifier).setPin(PinFilter.help);
      container.read(mapFiltersProvider.notifier).reset();
      expect(container.read(mapFiltersProvider).isDefault, isTrue);
    });
  });

  // ── MapFilters equality ────────────────────────────────────────────────────

  group('MapFilters', () {
    test('equal when same fields', () {
      expect(
        const MapFilters(pin: PinFilter.flare),
        equals(const MapFilters(pin: PinFilter.flare)),
      );
    });

    test('not equal when different pin', () {
      expect(
        const MapFilters(pin: PinFilter.flare),
        isNot(equals(const MapFilters(pin: PinFilter.help))),
      );
    });

    test('hashCode consistent with equality', () {
      const a = MapFilters(pin: PinFilter.business);
      const b = MapFilters(pin: PinFilter.business);
      expect(a.hashCode, equals(b.hashCode));
    });
  });

  // ── ghostModeProvider ──────────────────────────────────────────────────────

  group('ghostModeProvider', () {
    test('initial state is false', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(ghostModeProvider), isFalse);
    });

    test('toggle flips state', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(ghostModeProvider.notifier).toggle();
      expect(container.read(ghostModeProvider), isTrue);
      container.read(ghostModeProvider.notifier).toggle();
      expect(container.read(ghostModeProvider), isFalse);
    });

    test('enable sets true, disable sets false', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(ghostModeProvider.notifier).enable();
      expect(container.read(ghostModeProvider), isTrue);

      container.read(ghostModeProvider.notifier).disable();
      expect(container.read(ghostModeProvider), isFalse);
    });

    test('enable is idempotent when already enabled', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(ghostModeProvider.notifier).enable();
      container.read(ghostModeProvider.notifier).enable(); // noop
      expect(container.read(ghostModeProvider), isTrue);
    });
  });
}
