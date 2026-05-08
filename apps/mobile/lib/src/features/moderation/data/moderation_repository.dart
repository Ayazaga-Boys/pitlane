import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/moderation.dart';

final moderationRepositoryProvider = Provider<ModerationRepository>((ref) {
  return ModerationRepository(ref.watch(supabaseClientProvider));
});

class ModerationRepository {
  ModerationRepository(this._supabase)
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

  Future<void> report(CreateReportDraft draft) async {
    try {
      await _dio.post<void>(
        '/v1/reports',
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      if (error.response?.statusCode == 422) {
        throw const ValidationException('Şikayet bilgilerini kontrol et.');
      }
    }
  }

  Future<void> blockUser(String userId) async {
    try {
      await _dio.post<void>(
        '/v1/blocks/$userId',
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
    if (token == null) throw const UnauthorizedException();
    return {'Authorization': 'Bearer $token'};
  }
}
