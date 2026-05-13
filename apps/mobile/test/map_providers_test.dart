import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:rollpit/src/features/map/data/ws_service.dart';
import 'package:rollpit/src/features/map/providers/ghost_mode_provider.dart';
import 'package:rollpit/src/features/map/providers/map_pins_provider.dart';
import 'package:rollpit/src/features/map/ui/map_filter_sheet.dart';

// Mock pinler — allPinsProvider'ı override etmek için
const _mockPins = [
  MapPin(
    id: 'flare-1',
    type: MapPinType.flare,
    title: 'Test Flare',
    position: LatLng(41.0369, 28.9850),
  ),
  MapPin(
    id: 'biz-1',
    type: MapPinType.business,
    title: 'Test Business',
    position: LatLng(41.0600, 28.9870),
  ),
  MapPin(
    id: 'help-1',
    type: MapPinType.help,
    title: 'Test Help',
    position: LatLng(40.9900, 29.0230),
  ),
];

ProviderContainer _containerWithPins() => ProviderContainer(
      overrides: [
        allPinsProvider.overrideWith((ref) async => _mockPins),
      ],
    );

void main() {
  // ── filteredPinsProvider ───────────────────────────────────────────────────

  group('filteredPinsProvider', () {
    test('all filter returns all pins', () async {
      final container = _containerWithPins();
      addTearDown(container.dispose);

      await container.read(allPinsProvider.future);

      final pins = container.read(filteredPinsProvider(const MapFilters()));
      expect(pins.length, equals(3));
    });

    test('flare filter returns only flare pins', () async {
      final container = _containerWithPins();
      addTearDown(container.dispose);

      await container.read(allPinsProvider.future);

      final pins = container.read(
        filteredPinsProvider(const MapFilters(pin: PinFilter.flare)),
      );
      expect(pins.every((p) => p.type == MapPinType.flare), isTrue);
      expect(pins.length, equals(1));
    });

    test('help filter returns only help pins', () async {
      final container = _containerWithPins();
      addTearDown(container.dispose);

      await container.read(allPinsProvider.future);

      final pins = container.read(
        filteredPinsProvider(const MapFilters(pin: PinFilter.help)),
      );
      expect(pins.every((p) => p.type == MapPinType.help), isTrue);
    });

    test('business filter returns only business pins', () async {
      final container = _containerWithPins();
      addTearDown(container.dispose);

      await container.read(allPinsProvider.future);

      final pins = container.read(
        filteredPinsProvider(const MapFilters(pin: PinFilter.business)),
      );
      expect(pins.every((p) => p.type == MapPinType.business), isTrue);
    });

    test('API error returns empty list (uygulama cokpmez)', () async {
      final container = ProviderContainer(
        overrides: [
          allPinsProvider.overrideWith(
            (ref) async => throw Exception('network error'),
          ),
        ],
      );
      addTearDown(container.dispose);

      final pins = container.read(filteredPinsProvider(const MapFilters()));
      expect(pins, isEmpty);
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

  group('WS help events', () {
    test('parses help_nearby event', () {
      final event = parseWsHelpEvent({
        'type': 'help_nearby',
        'help_id': 'help-1',
        'h3_cell': '89283082803ffff',
        'issue_type': 'flat_tire',
      });

      expect(event, isNotNull);
      expect(event!.type, WsHelpEventType.nearby);
      expect(event.helpId, 'help-1');
      expect(event.h3Cell, '89283082803ffff');
      expect(event.issueType, 'flat_tire');
    });

    test('parses help_assigned event', () {
      final event = parseWsHelpEvent({
        'type': 'help_assigned',
        'help_id': 'help-1',
        'h3_cell': '89283082803ffff',
        'requester_id': 'user-1',
        'helper_id': 'user-2',
      });

      expect(event, isNotNull);
      expect(event!.type, WsHelpEventType.assigned);
      expect(event.requesterId, 'user-1');
      expect(event.helperId, 'user-2');
    });

    test('ignores malformed help event', () {
      final event = parseWsHelpEvent({
        'type': 'help_nearby',
        'h3_cell': '89283082803ffff',
      });

      expect(event, isNull);
    });
  });
}
