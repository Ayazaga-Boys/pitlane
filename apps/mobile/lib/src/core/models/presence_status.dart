enum PresenceStatus {
  online('online'),
  dnd('dnd'),
  offline('offline');

  const PresenceStatus(this.apiValue);

  final String apiValue;

  static PresenceStatus fromApiValue(String? value) {
    return PresenceStatus.values.firstWhere(
      (status) => status.apiValue == value,
      orElse: () => PresenceStatus.offline,
    );
  }
}
