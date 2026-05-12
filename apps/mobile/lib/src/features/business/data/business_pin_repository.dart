import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/business_pin.dart';

final businessPinRepositoryProvider = Provider<BusinessPinRepository>((ref) {
  return BusinessPinRepository(ref.watch(supabaseClientProvider));
});

class BusinessPinRepository {
  BusinessPinRepository(this._supabase)
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

  Future<BusinessPin> getBusinessPin(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/pins/$id',
        options: Options(headers: _authHeaders()),
      );

      return BusinessPin.fromJson(response.data ?? const {});
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return _mockBusinessPin(id);
    }
  }

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null) throw const UnauthorizedException();
    return {'Authorization': 'Bearer $token'};
  }

  BusinessPin _mockBusinessPin(String id) {
    return BusinessPin(
      id: id,
      name: 'Rollpit Garage',
      category: BusinessPinCategory.garage,
      h3Cell: '89283082803ffff',
      address: 'Maslak, İstanbul',
      phone: '+90 212 000 00 00',
      website: 'https://rollpit.local/garage',
      isVerified: true,
      campaignText: 'Bugün Rollpit üyelerine hızlı kontrol indirimi.',
      campaignEndsAt: DateTime.now().add(const Duration(days: 3)),
    );
  }
}
