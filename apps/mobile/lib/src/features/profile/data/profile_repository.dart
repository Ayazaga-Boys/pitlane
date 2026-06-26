import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../models/rollpit_profile.dart';
import '../models/vehicle.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(supabaseClientProvider));
});

class ProfileRepository {
  ProfileRepository(this._supabase)
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

  Future<RollpitProfile?> getCurrentProfile() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      // dev bypass: profil yok, tamamlama adımı gösterilir
      return null;
    }
    final data = await _supabase
        .from('profiles')
        .select(
          'id,username,display_name,avatar_url,bio,ghost_mode,is_verified',
        )
        .eq('id', userId)
        .maybeSingle();

    return data == null ? null : RollpitProfile.fromJson(data);
  }

  Future<List<Vehicle>> getVehicles() async {
    final response = await _request(
      () => _dio.get<Map<String, dynamic>>(
        '/v1/profiles/me/vehicles',
        options: Options(headers: _authHeaders()),
      ),
    );

    final items = response.data?['data'] as List<dynamic>? ?? const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(Vehicle.fromJson)
        .toList(growable: false);
  }

  Future<RollpitProfile> updateProfile({
    required String username,
    required String displayName,
    String? avatarUrl,
  }) async {
    final userId = _currentUserId();
    final current = await getCurrentProfile();

    await _request(
      () => _dio.patch<Map<String, dynamic>>(
        '/v1/profiles/me',
        data: {
          'display_name': displayName,
          if (avatarUrl != null && avatarUrl.isNotEmpty)
            'avatar_url': avatarUrl,
        },
        options: Options(headers: _authHeaders()),
      ),
    );

    if (current?.username != username) {
      await _supabase
          .from('profiles')
          .update({'username': username}).eq('id', userId);
    }

    final updated = await getCurrentProfile();
    if (updated == null) throw const NotFoundException('Profil bulunamadı.');
    return updated;
  }

  Future<Vehicle> addVehicle({
    required VehicleType type,
    required String make,
    required String model,
    int? year,
    String? color,
    String? iconSlug,
  }) async {
    final response = await _request(
      () => _dio.post<Map<String, dynamic>>(
        '/v1/profiles/me/vehicles',
        data: {
          'type': type.apiValue,
          'make': make,
          'model': model,
          if (year != null) 'year': year,
          if (color != null && color.isNotEmpty) 'color': color,
          if (iconSlug != null && iconSlug.isNotEmpty) 'icon_slug': iconSlug,
          'is_primary': true,
        },
        options: Options(headers: _authHeaders()),
      ),
    );

    final data = response.data?['data'];
    if (data is! Map<String, dynamic>) {
      throw const ServerException('Araç kaydı okunamadı.');
    }
    return Vehicle.fromJson(data);
  }

  Future<Vehicle> setPrimaryVehicle(String vehicleId) async {
    final response = await _request(
      () => _dio.patch<Map<String, dynamic>>(
        '/v1/profiles/me/vehicles/$vehicleId',
        data: const {'is_primary': true},
        options: Options(headers: _authHeaders()),
      ),
    );

    final data = response.data?['data'];
    if (data is! Map<String, dynamic>) {
      throw const ServerException('Araç kaydı okunamadı.');
    }
    return Vehicle.fromJson(data);
  }

  Future<Vehicle> updateVehicleIcon({
    required String vehicleId,
    required String iconSlug,
  }) async {
    final response = await _request(
      () => _dio.patch<Map<String, dynamic>>(
        '/v1/profiles/me/vehicles/$vehicleId',
        data: {'icon_slug': iconSlug},
        options: Options(headers: _authHeaders()),
      ),
    );

    final data = response.data?['data'];
    if (data is! Map<String, dynamic>) {
      throw const ServerException('Araç kaydı okunamadı.');
    }
    return Vehicle.fromJson(data);
  }

  Future<void> requestDataExport() async {
    await _request(
      () => _dio.get<Map<String, dynamic>>(
        '/v1/profiles/me/export',
        options: Options(headers: _authHeaders()),
      ),
    );
  }

  Future<void> requestAccountDeletion({String? reason}) async {
    await _request(
      () => _dio.delete<Map<String, dynamic>>(
        '/v1/profiles/me',
        data: {if (reason != null && reason.isNotEmpty) 'reason': reason},
        options: Options(headers: _authHeaders()),
      ),
    );
  }

  String _currentUserId() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      if (AppConstants.isDev) return 'dev-user-bypass';
      throw const UnauthorizedException();
    }
    return userId;
  }

  Map<String, String> _authHeaders() {
    final token = _supabase.auth.currentSession?.accessToken;
    if (token == null) {
      if (AppConstants.isDev) {
        return {
          'x-dev-user-id': 'dev-user-bypass',
          'x-dev-user-email': 'dev@rollpit.test',
        };
      }
      throw const UnauthorizedException();
    }
    return {'Authorization': 'Bearer $token'};
  }

  Future<Response<T>> _request<T>(
    Future<Response<T>> Function() request,
  ) async {
    try {
      return await request();
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      final message = _extractErrorMessage(error.response?.data);

      if (statusCode == 401) throw UnauthorizedException(message);
      if (statusCode == 404) throw NotFoundException(message);
      if (statusCode == 422 || statusCode == 409) {
        throw ValidationException(message);
      }
      if (statusCode != null && statusCode >= 500) {
        throw ServerException(message);
      }
      throw NetworkException(message);
    } on PostgrestException catch (error) {
      throw ValidationException(error.message);
    }
  }

  String _extractErrorMessage(Object? data) {
    if (data is Map<String, dynamic>) {
      final error = data['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    return 'İşlem tamamlanamadı. Tekrar dener misin?';
  }
}
