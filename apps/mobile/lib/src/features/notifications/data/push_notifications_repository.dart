import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/push_notification.dart';

final pushNotificationsRepositoryProvider =
    Provider<PushNotificationsRepository>((ref) {
  return PushNotificationsRepository(ref.watch(supabaseClientProvider));
});

class PushNotificationsRepository {
  PushNotificationsRepository(this._supabase)
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

  Future<void> registerDevice(DeviceRegistrationDraft draft) async {
    try {
      await _dio.post<void>(
        '/v1/notifications/devices',
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      if (error.response?.statusCode == 404) return;
    }
  }

  Future<void> unregisterDevice(String token) async {
    try {
      await _dio.delete<void>(
        '/v1/notifications/devices/$token',
        options: Options(headers: _authHeaders()),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      if (error.response?.statusCode == 404) return;
    }
  }

  DeviceRegistrationDraft developmentDeviceDraft() {
    return DeviceRegistrationDraft(
      platform: Platform.isIOS ? 'ios' : 'android',
      token: 'rollpit-dev-device-token-${Platform.operatingSystem}',
      appBuild: 'dev',
    );
  }

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token != null) return {'Authorization': 'Bearer $token'};
    if (AppConstants.isDev) {
      return {
        'x-dev-user-id': 'c87820f3-a0af-4fe0-b848-6593ef413846',
        'x-dev-user-email': 'dev@rollpit.test',
      };
    }
    throw const UnauthorizedException();
  }
}
