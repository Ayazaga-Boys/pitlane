import 'package:flutter_riverpod/flutter_riverpod.dart';

class LocationSharingNotifier extends Notifier<bool> {
  @override
  bool build() => true;

  void setEnabled(bool value) => state = value;
  void enable() => state = true;
  void disable() => state = false;
  void toggle() => state = !state;
}

final locationSharingProvider = NotifierProvider<LocationSharingNotifier, bool>(
  LocationSharingNotifier.new,
);
