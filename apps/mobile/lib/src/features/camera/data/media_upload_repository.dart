import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/snap_camera.dart';

final mediaUploadRepositoryProvider = Provider<MediaUploadRepository>((ref) {
  return MediaUploadRepository(ref.watch(supabaseClientProvider));
});

class MediaUploadRepository {
  MediaUploadRepository(this._supabase)
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

  Future<SnapUploadResult> prepareUpload(SnapDraft draft) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/v1/media/upload-url',
        data: {
          'filename': draft.filename,
          'content_type': draft.contentType,
          'asset_type': draft.mode.apiValue,
          'size_bytes': draft.mode == SnapMode.photo ? 900000 : 18000000,
        },
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) {
        return SnapUploadResult(
          assetId: data['asset_id'] as String? ?? _mockAssetId(draft),
          uploadUrl: data['upload_url'] as String?,
        );
      }
      return SnapUploadResult(assetId: _mockAssetId(draft));
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return SnapUploadResult(assetId: _mockAssetId(draft));
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

  String _mockAssetId(SnapDraft draft) {
    return 'local-${draft.mode.apiValue}-${DateTime.now().millisecondsSinceEpoch}';
  }
}
