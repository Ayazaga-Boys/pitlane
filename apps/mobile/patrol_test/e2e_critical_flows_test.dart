import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:rollpit/app.dart';
import 'package:rollpit/src/core/theme/app_theme.dart';
import 'package:rollpit/src/features/flares/ui/flare_create_screen.dart';
import 'package:rollpit/src/features/map/providers/map_pins_provider.dart';

void main() {
  patrolTest('E2E-01: app opens on map shell', ($) async {
    await _pumpRollpitApp($);

    expect($('Harita'), findsWidgets);
    expect($(Icons.sos), findsOneWidget);
  });

  patrolTest('E2E-02: flare creation form accepts route data', ($) async {
    await $.tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: AppTheme.dark,
          home: const FlareCreateScreen(initialH3Cell: '89283082803ffff'),
        ),
      ),
    );
    await $.tester.pump();

    expect($('Flare oluştur'), findsOneWidget);
    await $(TextField).at(0).enterText('Sahil cruise');
    await $(TextField).at(1).enterText('Kısa rota ve buluşma notu');

    expect($('Yayınla'), findsOneWidget);
  });

  patrolTest('E2E-03: SOS flow opens help sheet', ($) async {
    await _pumpRollpitApp($);

    await $(Icons.sos).tap();
    await $.tester.pumpAndSettle();

    expect($('Acil Yardım'), findsOneWidget);
    expect($('Yardım İste'), findsOneWidget);
  });

  patrolTest('E2E-04: DM tab is reachable from shell', ($) async {
    await _pumpRollpitApp($);

    await $('Mesajlar').tap();
    await $.tester.pump();

    expect($('Mesajlar'), findsWidgets);
  });

  patrolTest('E2E-05: ghost mode toggles map visibility state', ($) async {
    await _pumpRollpitApp($);

    await $('Görünür').tap();
    await $.tester.pump();
    expect($('Hayalet'), findsOneWidget);

    await $('Hayalet').tap();
    await $.tester.pump();
    expect($('Görünür'), findsOneWidget);
  });
}

Future<void> _pumpRollpitApp(PatrolIntegrationTester $) async {
  await $.tester.pumpWidget(
    ProviderScope(
      overrides: [
        allPinsProvider.overrideWith((ref) async => []),
      ],
      child: const RollpitApp(),
    ),
  );
  await $.tester.pump(const Duration(seconds: 3));
}
