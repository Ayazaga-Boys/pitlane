import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/settings/providers/settings_provider.dart';

void main() {
  test('SettingsPreferences disables dnd when presence is hidden', () {
    const prefs = SettingsPreferences(dndMode: true);

    final next = prefs.copyWith(
      showOnlineStatus: false,
      dndMode: false,
    );

    expect(next.showOnlineStatus, isFalse);
    expect(next.dndMode, isFalse);
  });
}
