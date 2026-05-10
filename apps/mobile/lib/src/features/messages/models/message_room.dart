enum MessageRoomType {
  community('community', 'communities', 'Topluluk sohbeti'),
  flare('flare', 'flares', 'Flare sohbeti');

  const MessageRoomType(this.apiValue, this.pathSegment, this.title);

  final String apiValue;
  final String pathSegment;
  final String title;
}

class MessageRoom {
  const MessageRoom({
    required this.type,
    required this.id,
    this.title,
  });

  final MessageRoomType type;
  final String id;
  final String? title;

  String get endpoint => '/v1/messages/${type.pathSegment}/$id';
  String get realtimeTopic => '${type.apiValue}:$id';
  String get displayTitle => title ?? type.title;
}
