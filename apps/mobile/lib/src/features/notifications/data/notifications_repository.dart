import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/pitlane_notification.dart';

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {
  return NotificationsRepository(ref.watch(supabaseClientProvider));
});

class NotificationsRepository {
  NotificationsRepository(this._supabase)
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

  Future<List<PitlaneNotification>> listNotifications() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/notifications',
        options: Options(headers: _authHeaders()),
      );

      final items = response.data?['data'] as List<dynamic>? ?? const [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(PitlaneNotification.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return _mockNotifications;
    }
  }

  Future<void> markAllRead() async {
    try {
      await _dio.patch<void>(
        '/v1/notifications/read-all',
        options: Options(headers: _authHeaders()),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _dio.patch<void>(
        '/v1/notifications/$id/read',
        options: Options(headers: _authHeaders()),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
    }
  }

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token != null) return {'Authorization': 'Bearer $token'};
    if (AppConstants.isDev) {
      return {
        'x-dev-user-id': 'c87820f3-a0af-4fe0-b848-6593ef413846',
        'x-dev-user-email': 'dev@pitlane.test',
      };
    }
    throw const UnauthorizedException();
  }

  static const _mockNotifications = [
    PitlaneNotification(
      id: 'flare-starting',
      type: PitlaneNotificationType.flareStarting,
      title: 'Sahil cruise yaklaşıyor',
      body: 'Flare 1 saat içinde başlıyor.',
      deepLink: '/flares/sahil-cruise',
      createdAtLabel: '12 dk',
    ),
    PitlaneNotification(
      id: 'dm-new',
      type: PitlaneNotificationType.dmNew,
      title: 'Mert yeni mesaj gönderdi',
      body: 'Cumartesi rota için 10:15 gibi çıkalım mı?',
      deepLink: '/messages/mert',
      createdAtLabel: '34 dk',
    ),
    PitlaneNotification(
      id: 'community-message',
      type: PitlaneNotificationType.communityMessage,
      title: 'Istanbul Riders',
      body: 'Topluluk sohbetinde yeni mesajlar var.',
      deepLink: '/communities/istanbul-riders/messages',
      createdAtLabel: 'Dün',
      isRead: true,
    ),
    PitlaneNotification(
      id: 'help-nearby',
      type: PitlaneNotificationType.helpNearby,
      title: 'Yakında yardım gerekiyor',
      body: '100 m mesafede bir sürücü acil yardım istiyor.',
      deepLink: '/help/local-help',
      createdAtLabel: 'Şimdi',
    ),
  ];
}
