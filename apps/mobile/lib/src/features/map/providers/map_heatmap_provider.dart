import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../ui/map_filter_sheet.dart';

class VehicleHeatmapRepository {
  VehicleHeatmapRepository(this._dio, this._readToken);

  final Dio _dio;
  final String? Function() _readToken;

  Future<Map<String, int>> getHeatmap(VehicleFilter vehicleFilter) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/v2/map/heatmap',
      queryParameters: {'vehicle_type': vehicleFilter.apiValue},
      options: Options(headers: _headers()),
    );
    final items = (response.data?['data'] as List<dynamic>?) ?? const [];
    return {
      for (final raw in items)
        if (raw is Map<String, dynamic>)
          raw['h3_cell'] as String: raw['user_count'] as int? ?? 0,
    };
  }

  Map<String, String> _headers() {
    final token = _readToken();
    return {
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      if (AppConstants.isDev) 'x-dev-user-id': 'dev-user-map',
      if (AppConstants.isDev) 'x-dev-user-email': 'dev@rollpit.test',
    };
  }
}

extension VehicleFilterApiValue on VehicleFilter {
  String get apiValue => switch (this) {
        VehicleFilter.all => 'any',
        VehicleFilter.car => 'car',
        VehicleFilter.motorcycle => 'motorcycle',
      };
}

final vehicleHeatmapRepositoryProvider = Provider<VehicleHeatmapRepository>((
  ref,
) {
  final supabase = ref.watch(supabaseClientProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
      receiveTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  return VehicleHeatmapRepository(
    dio,
    () => supabase.auth.currentSession?.accessToken,
  );
});

final vehicleHeatmapProvider =
    FutureProvider.family<Map<String, int>, VehicleFilter>((ref, filter) {
  return ref.watch(vehicleHeatmapRepositoryProvider).getHeatmap(filter);
});
