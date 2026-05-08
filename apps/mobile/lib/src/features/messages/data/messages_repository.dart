import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/dm_thread.dart';

final messagesRepositoryProvider = Provider<MessagesRepository>((ref) {
  return MessagesRepository(ref.watch(supabaseClientProvider));
});

class MessagesRepository {
  MessagesRepository(this._supabase)
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConstants.apiBaseUrl,
            connectTimeout:
                const Duration(seconds: AppConstants.apiTimeoutSeconds),
            receiveTimeout:
                const Duration(seconds: AppConstants.apiTimeoutSeconds),
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

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null) throw const UnauthorizedException();
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
}
