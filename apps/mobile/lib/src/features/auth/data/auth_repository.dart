import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  /// POST /v1/auth/invite-codes/validate
  Future<({bool valid, int remainingUses})> validateInviteCode(
      String code) async {
    try {
      final res = await _dio.post(
        '${AppConstants.apiBaseUrl}/v1/auth/invite-codes/validate',
        data: {'code': code.trim().toUpperCase()},
      );
      final data = res.data['data'] as Map<String, dynamic>;
      return (
        valid: data['valid'] as bool,
        remainingUses: data['remaining_uses'] as int,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 422) {
        return (valid: false, remainingUses: 0);
      }
      throw const NetworkException();
    }
  }

  /// POST /v1/auth/waiting-list
  Future<void> joinWaitingList({
    required String email,
    required String vehicleType,
    required String city,
  }) async {
    try {
      await _dio.post(
        '${AppConstants.apiBaseUrl}/v1/auth/waiting-list',
        data: {
          'email': email.trim(),
          'vehicle_type': vehicleType,
          'city': city,
        },
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        // Zaten kayıtlı — sorun değil
        return;
      }
      throw const NetworkException();
    }
  }
}

final _dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(_dioProvider));
});
