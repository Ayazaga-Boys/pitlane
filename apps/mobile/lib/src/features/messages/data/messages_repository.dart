import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/dm_message.dart';
import '../models/dm_thread.dart';
import '../models/message_room.dart';

final messagesRepositoryProvider = Provider<MessagesRepository>((ref) {
  return MessagesRepository(ref.watch(supabaseClientProvider));
});

class MessagesRepository {
  MessagesRepository(this._supabase)
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConstants.apiBaseUrl,
            connectTimeout: const Duration(
              seconds: AppConstants.apiTimeoutSeconds,
            ),
            receiveTimeout: const Duration(
              seconds: AppConstants.apiTimeoutSeconds,
            ),
            headers: const {'Content-Type': 'application/json'},
          ),
        );

  final SupabaseClient _supabase;
  final Dio _dio;

  Future<List<DmThread>> listDmThreads() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/messages/dms',
        options: Options(headers: _authHeaders()),
      );

      final items = response.data?['data'] as List<dynamic>? ?? const [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(DmThread.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return _mockThreads;
    }
  }

  Future<List<DmMessage>> listDmMessages(String peerId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/messages/dms/$peerId',
        options: Options(headers: _authHeaders()),
      );

      final items = response.data?['data'] as List<dynamic>? ?? const [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(DmMessage.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return _mockMessages(peerId);
    }
  }

  Future<DmMessage> sendDmMessage(
    String peerId,
    SendDmMessageDraft draft,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/v1/messages/dms/$peerId',
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return DmMessage.fromJson(data);
      return _messageFromDraft(draft);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      if (error.response?.statusCode == 403) {
        throw const ValidationException(
          'Bu kullanıcıya mesaj gönderemiyorsun.',
        );
      }
      return _messageFromDraft(draft);
    }
  }

  Future<List<DmMessage>> listRoomMessages(MessageRoom room) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        room.endpoint,
        options: Options(headers: _authHeaders()),
      );

      final items = response.data?['data'] as List<dynamic>? ?? const [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(DmMessage.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return _mockRoomMessages(room);
    }
  }

  Future<DmMessage> sendRoomMessage(
    MessageRoom room,
    SendDmMessageDraft draft,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        room.endpoint,
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return DmMessage.fromJson(data);
      return _messageFromDraft(draft);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      if (error.response?.statusCode == 403) {
        throw const ValidationException('Bu odada mesaj gönderemiyorsun.');
      }
      return _messageFromDraft(draft);
    }
  }

  RealtimeChannel subscribeToDmMessages(
    String peerId,
    void Function(DmMessage message) onMessage,
  ) {
    final channel = _supabase.channel('dm:$peerId');
    channel
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) {
            final message = DmMessage.fromJson(payload.newRecord);
            if (_messageBelongsToPeer(payload.newRecord, peerId)) {
              onMessage(message);
            }
          },
        )
        .subscribe();
    return channel;
  }

  RealtimeChannel subscribeToRoomMessages(
    MessageRoom room,
    void Function(DmMessage message) onMessage,
  ) {
    final channel = _supabase.channel(room.realtimeTopic);
    channel
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) {
            final message = DmMessage.fromJson(payload.newRecord);
            if (_messageBelongsToRoom(payload.newRecord, room)) {
              onMessage(message);
            }
          },
        )
        .subscribe();
    return channel;
  }

  Future<void> unsubscribe(RealtimeChannel channel) {
    return _supabase.removeChannel(channel);
  }

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null) {
      if (AppConstants.isDev) {
        return {
          'x-dev-user-id': 'dev-user-bypass',
          'x-dev-user-email': 'dev@rollpit.test',
        };
      }
      throw const UnauthorizedException();
    }
    return {'Authorization': 'Bearer $token'};
  }

  static const _mockThreads = [
    DmThread(
      peerId: 'mert',
      username: 'mert_cb650r',
      displayName: 'Mert Yılmaz',
      lastMessagePreview: 'Cumartesi rota için 10:15 gibi çıkalım mı?',
      lastMessageAtLabel: '8 dk',
      unreadCount: 2,
      isOnline: true,
    ),
    DmThread(
      peerId: 'selin',
      username: 'selin_e30',
      displayName: 'Selin Arslan',
      lastMessagePreview: 'Parça linkini attım, bir bakarsın.',
      lastMessageAtLabel: '42 dk',
      isOnline: true,
    ),
    DmThread(
      peerId: 'deniz',
      username: 'deniz_garage',
      displayName: 'Deniz Kaya',
      lastMessagePreview: 'Garaj buluşmasına belki iki kişi daha gelir.',
      lastMessageAtLabel: 'Dün',
      unreadCount: 1,
    ),
  ];

  static List<DmMessage> _mockMessages(String peerId) {
    final now = DateTime.now();
    return [
      DmMessage(
        id: '$peerId-1',
        body: 'Selam, hafta sonu rota için hâlâ plan var mı?',
        createdAt: now.subtract(const Duration(hours: 2)),
        isMine: false,
        senderName: peerId,
      ),
      DmMessage(
        id: '$peerId-2',
        body: 'Var kanka, 10:15 gibi çıkalım diyoruz.',
        createdAt: now.subtract(const Duration(hours: 1, minutes: 48)),
        isMine: true,
      ),
      DmMessage(
        id: '$peerId-3',
        body: 'Tamamdır, konumu flare detayından takip ederim.',
        createdAt: now.subtract(const Duration(minutes: 8)),
        isMine: false,
        senderName: peerId,
      ),
    ];
  }

  static List<DmMessage> _mockRoomMessages(MessageRoom room) {
    final now = DateTime.now();
    final isFlare = room.type == MessageRoomType.flare;
    return [
      DmMessage(
        id: '${room.realtimeTopic}-1',
        body: isFlare
            ? 'Buluşma öncesi son durumları buradan konuşalım.'
            : 'Bu hafta sonu rota önerilerini buraya atalım.',
        createdAt: now.subtract(const Duration(hours: 3)),
        isMine: false,
        senderName: 'mert_cb650r',
      ),
      DmMessage(
        id: '${room.realtimeTopic}-2',
        body: isFlare
            ? 'Ben 10 dakika erken geliyorum.'
            : 'Sahil hattı sakin görünüyorsa oradan döneriz.',
        createdAt: now.subtract(const Duration(hours: 2, minutes: 20)),
        isMine: true,
      ),
      DmMessage(
        id: '${room.realtimeTopic}-3',
        body: isFlare
            ? 'Konum güncellenirse flare detayına bakarım.'
            : 'Tamam, alternatif rota da hazır olsun.',
        createdAt: now.subtract(const Duration(minutes: 34)),
        isMine: false,
        senderName: 'selin_e30',
      ),
    ];
  }

  DmMessage _messageFromDraft(SendDmMessageDraft draft) {
    return DmMessage(
      id: 'local-${DateTime.now().microsecondsSinceEpoch}',
      body: draft.body.trim(),
      createdAt: DateTime.now(),
      isMine: true,
    );
  }

  bool _messageBelongsToPeer(Map<String, dynamic> json, String peerId) {
    return json['peer_id'] == peerId ||
        json['sender_id'] == peerId ||
        json['recipient_id'] == peerId ||
        json['conversation_peer_id'] == peerId;
  }

  bool _messageBelongsToRoom(Map<String, dynamic> json, MessageRoom room) {
    return (json['room_type'] == room.type.apiValue &&
            json['room_id'] == room.id) ||
        json['community_id'] == room.id ||
        json['flare_id'] == room.id;
  }
}
