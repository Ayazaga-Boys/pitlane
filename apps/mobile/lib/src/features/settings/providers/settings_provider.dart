import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../profile/data/profile_repository.dart';

class SettingsPreferences {
  const SettingsPreferences({
    this.ghostModeShortcut = true,
    this.readReceipts = true,
    this.showOnlineStatus = true,
    this.dndMode = false,
    this.generalNotifications = true,
    this.drivingSafetyLock = true,
    this.language = SettingsLanguage.tr,
  });

  final bool ghostModeShortcut;
  final bool readReceipts;
  final bool showOnlineStatus;
  final bool dndMode;
  final bool generalNotifications;
  final bool drivingSafetyLock;
  final SettingsLanguage language;

  SettingsPreferences copyWith({
    bool? ghostModeShortcut,
    bool? readReceipts,
    bool? showOnlineStatus,
    bool? dndMode,
    bool? generalNotifications,
    bool? drivingSafetyLock,
    SettingsLanguage? language,
  }) {
    return SettingsPreferences(
      ghostModeShortcut: ghostModeShortcut ?? this.ghostModeShortcut,
      readReceipts: readReceipts ?? this.readReceipts,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      dndMode: dndMode ?? this.dndMode,
      generalNotifications: generalNotifications ?? this.generalNotifications,
      drivingSafetyLock: drivingSafetyLock ?? this.drivingSafetyLock,
      language: language ?? this.language,
    );
  }
}

enum SettingsLanguage {
  tr('Türkçe'),
  en('English');

  const SettingsLanguage(this.label);

  final String label;
}

class SettingsPreferencesNotifier extends Notifier<SettingsPreferences> {
  @override
  SettingsPreferences build() {
    return const SettingsPreferences();
  }

  void update(SettingsPreferences next) {
    state = next;
  }
}

final settingsPreferencesProvider =
    NotifierProvider<SettingsPreferencesNotifier, SettingsPreferences>(
  SettingsPreferencesNotifier.new,
);

class SettingsActionsNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> requestDataExport() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(profileRepositoryProvider).requestDataExport(),
    );
  }

  Future<void> requestAccountDeletion({String? reason}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref
          .read(profileRepositoryProvider)
          .requestAccountDeletion(reason: reason),
    );
  }
}

final settingsActionsProvider =
    AsyncNotifierProvider<SettingsActionsNotifier, void>(
  SettingsActionsNotifier.new,
);
