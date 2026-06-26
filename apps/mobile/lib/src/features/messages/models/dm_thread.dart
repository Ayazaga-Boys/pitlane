import '../../../core/models/presence_status.dart';

class DmThread {
  const DmThread({
    required this.peerId,
    required this.displayName,
    required this.lastMessagePreview,
    required this.lastMessageAtLabel,
    this.username,
    this.avatarUrl,
    this.unreadCount = 0,
    this.isOnline = false,
    this.presenceStatus = PresenceStatus.offline,
    this.presenceVisible = true,
  });

  factory DmThread.fromJson(Map<String, dynamic> json) {
    final isOnline = json['is_online'] as bool? ?? false;
    final rawPresenceStatus = json['presence_status'] as String?;
    final presenceStatus = PresenceStatus.fromApiValue(rawPresenceStatus);

    return DmThread(
      peerId: json['peer_id'] as String? ?? json['id'] as String? ?? '',
      displayName:
          json['display_name'] as String? ?? json['username'] as String? ?? '',
      username: json['username'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      lastMessagePreview: json['last_message_preview'] as String? ??
          json['last_message'] as String? ??
          'Henüz mesaj yok',
      lastMessageAtLabel: json['last_message_at_label'] as String? ??
          json['last_message_at'] as String? ??
          '',
      unreadCount: json['unread_count'] as int? ?? 0,
      isOnline: isOnline,
      presenceStatus: rawPresenceStatus == null && isOnline
          ? PresenceStatus.online
          : presenceStatus,
      presenceVisible: json['presence_visible'] as bool? ?? true,
    );
  }

  final String peerId;
  final String displayName;
  final String? username;
  final String? avatarUrl;
  final String lastMessagePreview;
  final String lastMessageAtLabel;
  final int unreadCount;
  final bool isOnline;
  final PresenceStatus presenceStatus;
  final bool presenceVisible;
}
