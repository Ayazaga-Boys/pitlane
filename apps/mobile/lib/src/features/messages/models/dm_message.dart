class DmMessage {
  const DmMessage({
    required this.id,
    required this.body,
    required this.createdAt,
    required this.isMine,
    this.senderName,
  });

  factory DmMessage.fromJson(Map<String, dynamic> json) {
    return DmMessage(
      id: json['id'] as String? ?? '',
      body: json['body'] as String? ?? '',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      isMine:
          json['is_mine'] as bool? ?? json['sender_is_me'] as bool? ?? false,
      senderName: json['sender_name'] as String?,
    );
  }

  final String id;
  final String body;
  final DateTime createdAt;
  final bool isMine;
  final String? senderName;
}

class SendDmMessageDraft {
  const SendDmMessageDraft({required this.body});

  final String body;

  Map<String, dynamic> toJson() {
    return {'body': body.trim()};
  }
}
