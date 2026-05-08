import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/help_request.dart';

final helpRepositoryProvider = Provider<HelpRepository>((ref) {
  return HelpRepository(ref.watch(supabaseClientProvider));
});

class HelpRepository {
  HelpRepository(this._supabase)
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

  Future<HelpRequest> createHelpRequest(CreateHelpRequestDraft draft) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/v1/help-requests',
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return HelpRequest.fromJson(data);
      return _mockHelpRequest(draft);
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) throw const UnauthorizedException();
      if (statusCode == 409 || statusCode == 422) {
        throw ValidationException(_extractErrorMessage(error.response?.data));
      }
      return _mockHelpRequest(draft);
    }
  }

  Future<HelpRequest?> getMyOpenHelpRequest() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/help-requests/mine',
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return HelpRequest.fromJson(data);
      return null;
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return null;
    }
  }

  Future<HelpRequest> cancelHelpRequest(HelpRequest request) async {
    try {
      final response = await _dio.delete<Map<String, dynamic>>(
        '/v1/help-requests/${request.id}',
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return HelpRequest.fromJson(data);
      return HelpRequest.fromJson({
        'id': request.id,
        'requester_id': request.requesterId,
        'h3_cell': request.h3Cell,
        'issue_type': request.issueType.apiValue,
        'description': request.description,
        'status': HelpRequestStatus.cancelled.apiValue,
        'helper_id': request.helperId,
        'expires_at': request.expiresAt.toIso8601String(),
        'created_at': request.createdAt.toIso8601String(),
      });
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      if (error.response?.statusCode == 404) throw const NotFoundException();
      rethrow;
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

  HelpRequest _mockHelpRequest(CreateHelpRequestDraft draft) {
    final now = DateTime.now();
    return HelpRequest(
      id: 'local-help-${now.millisecondsSinceEpoch}',
      requesterId: 'dev-user',
      h3Cell: draft.h3Cell,
      issueType: draft.issueType,
      description: draft.description,
      status: HelpRequestStatus.open,
      expiresAt: now.add(const Duration(minutes: 30)),
      createdAt: now,
    );
  }

  String _extractErrorMessage(Object? data) {
    if (data is Map<String, dynamic>) {
      final error = data['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    return 'Yardım isteğini kontrol et.';
  }
}
