import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../constants/community_constants.dart';
import '../models/community.dart';
import '../models/community_detail.dart';

final communityRepositoryProvider = Provider<CommunityRepository>((ref) {
  return CommunityRepository(ref.watch(supabaseClientProvider));
});

class CommunityRepository {
  CommunityRepository(this._supabase)
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

  Future<List<Community>> listCommunities(CommunityFilters filters) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/communities',
        queryParameters: {
          'limit': CommunityConstants.pageSize,
          if (filters.query.trim().isNotEmpty) 'q': filters.query.trim(),
          if (filters.city.trim().isNotEmpty) 'city': filters.city.trim(),
          if (filters.vehicleType != CommunityVehicleType.all)
            'vehicle_type': filters.vehicleType.apiValue,
        },
        options: Options(headers: _authHeaders()),
      );

      final items = response.data?['data'] as List<dynamic>? ?? const [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(Community.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) throw const UnauthorizedException();
      return _mockCommunities(filters);
    }
  }

  Future<CommunityDetail> getCommunityDetail(String slug) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/communities/$slug',
        options: Options(headers: _authHeaders()),
      );

      return CommunityDetail.fromJson(response.data ?? const {});
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) throw const UnauthorizedException();
      final community = _seedCommunities.firstWhere(
        (item) => item.slug == slug,
        orElse: () => _seedCommunities.first,
      );
      return _mockDetail(community);
    }
  }

  Future<Community> createCommunity(CreateCommunityDraft draft) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/v1/communities',
        data: draft.toJson(),
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) {
        return Community.fromJson(data);
      }
      return _communityFromDraft(draft);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
      return _communityFromDraft(draft);
    }
  }

  Future<void> joinCommunity(String id) async {
    try {
      await _dio.post<void>(
        '/v1/communities/$id/join',
        options: Options(headers: _authHeaders()),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const UnauthorizedException();
      }
    }
  }

  Future<void> leaveCommunity(String id) async {
    try {
      await _dio.delete<void>(
        '/v1/communities/$id/leave',
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

  List<Community> _mockCommunities(CommunityFilters filters) {
    final query = filters.query.trim().toLowerCase();
    final city = filters.city.trim().toLowerCase();

    return _seedCommunities.where((community) {
      final matchesQuery = query.isEmpty ||
          community.name.toLowerCase().contains(query) ||
          community.slug.toLowerCase().contains(query) ||
          (community.description?.toLowerCase().contains(query) ?? false);
      final matchesCity = city.isEmpty ||
          (community.city?.toLowerCase().contains(city) ?? false);
      final matchesVehicle = filters.vehicleType == CommunityVehicleType.all ||
          community.vehicleType == filters.vehicleType ||
          community.vehicleType == CommunityVehicleType.all;

      return matchesQuery && matchesCity && matchesVehicle;
    }).toList(growable: false);
  }

  static const _seedCommunities = [
    Community(
      id: 'istanbul-riders',
      name: 'Istanbul Riders',
      slug: 'istanbul-riders',
      description: 'Hafta sonu sahil ve orman rotaları.',
      type: CommunityType.public,
      vehicleType: CommunityVehicleType.motorcycle,
      city: 'İstanbul',
      memberCount: 248,
      isVerified: true,
      lastActivityLabel: '12 dk önce',
    ),
    Community(
      id: 'classic-garage',
      name: 'Classic Garage TR',
      slug: 'classic-garage-tr',
      description: 'Klasik otomobil garajları, buluşmalar ve parça sohbeti.',
      type: CommunityType.public,
      vehicleType: CommunityVehicleType.car,
      city: 'Ankara',
      memberCount: 132,
      isVerified: true,
      lastActivityLabel: '1 saat önce',
    ),
    Community(
      id: 'cars-coffee-izmir',
      name: 'Cars & Coffee İzmir',
      slug: 'cars-coffee-izmir',
      description: 'Pazar sabahı buluşmaları ve şehir içi cruise.',
      type: CommunityType.public,
      vehicleType: CommunityVehicleType.all,
      city: 'İzmir',
      memberCount: 89,
      isVerified: false,
      lastActivityLabel: 'Dün',
    ),
  ];

  Community _communityFromDraft(CreateCommunityDraft draft) {
    return Community(
      id: draft.slug,
      name: draft.name,
      slug: draft.slug,
      description: draft.description,
      type: draft.type,
      vehicleType: draft.vehicleType,
      city: draft.city,
      coverUrl: draft.coverUrl,
      memberCount: 1,
      isVerified: false,
      lastActivityLabel: 'Az önce',
    );
  }

  CommunityDetail _mockDetail(Community community) {
    return CommunityDetail(
      community: community,
      isJoined: community.slug == 'istanbul-riders',
      members: const [
        CommunityMember(
          id: 'mert',
          username: 'mert_cb650r',
          displayName: 'Mert Yılmaz',
          role: 'captain',
        ),
        CommunityMember(
          id: 'selin',
          username: 'selin_e30',
          displayName: 'Selin Arslan',
          role: 'moderator',
        ),
        CommunityMember(
          id: 'deniz',
          username: 'deniz_garage',
          displayName: 'Deniz Kaya',
          role: 'member',
        ),
      ],
      flares: const [
        CommunityFlarePreview(
          id: 'sahil-cruise',
          title: 'Sahil cruise',
          startsAtLabel: 'Cumartesi 10:30',
          rsvpCount: 18,
        ),
        CommunityFlarePreview(
          id: 'garaj-bulusmasi',
          title: 'Garaj buluşması',
          startsAtLabel: 'Pazar 14:00',
          rsvpCount: 11,
        ),
      ],
    );
  }
}
