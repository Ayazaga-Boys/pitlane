import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/flare.dart';

final flareRepositoryProvider = Provider<FlareRepository>((ref) {
  return FlareRepository(ref.watch(supabaseClientProvider));
});

class FlareRepository {
  FlareRepository(this._supabase)
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

  Future<Flare> createFlare(CreateFlareDraft draft) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/v1/flares',
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return Flare.fromJson(data);
      return _flareFromDraft(draft);
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) throw const UnauthorizedException();
      if (statusCode == 422 || statusCode == 409) {
        throw ValidationException(_extractErrorMessage(error.response?.data));
      }
      return _flareFromDraft(draft);
    }
  }

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null) throw const UnauthorizedException();
    return {'Authorization': 'Bearer $token'};
  }

  Flare _flareFromDraft(CreateFlareDraft draft) {
    return Flare(
      id: 'local-${draft.startsAt.millisecondsSinceEpoch}',
      title: draft.title,
      description: draft.description,
      h3Cell: draft.h3Cell,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      communityId: draft.communityId,
      coverUrl: draft.coverUrl,
    );
  }

  String _extractErrorMessage(Object? data) {
    if (data is Map<String, dynamic>) {
      final error = data['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    return 'Flare bilgilerini kontrol et.';
  }
}
