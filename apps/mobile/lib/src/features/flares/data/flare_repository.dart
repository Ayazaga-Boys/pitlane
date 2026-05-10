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

  Future<Flare> getFlareDetail(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/v1/flares/$id',
        options: Options(headers: _authHeaders()),
      );

      return Flare.fromJson(response.data ?? const {});
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) throw const UnauthorizedException();
      return _mockFlare(id);
    }
  }

  Future<Flare> updateRsvp(
    String id,
    FlareRsvpStatus status,
    Flare current,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/v1/flares/$id/rsvp',
        data: {'status': status.apiValue},
        options: Options(headers: _authHeaders()),
      );

      final data = response.data?['data'];
      if (data is Map<String, dynamic>) return Flare.fromJson(data);
      return _flareWithRsvp(current, status);
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) throw const UnauthorizedException();
      if (statusCode == 422 || statusCode == 409) {
        throw ValidationException(_extractErrorMessage(error.response?.data));
      }
      return _flareWithRsvp(current, status);
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

  Flare _mockFlare(String id) {
    final startsAt = DateTime.now().add(const Duration(days: 1, hours: 2));
    return Flare(
      id: id,
      title: id == 'garaj-bulusmasi' ? 'Garaj buluşması' : 'Sahil cruise',
      description:
          'Kısa rota, temiz tempo ve buluşma sonrası kahve molası. Katılım durumunu seç, detaylar yaklaştıkça güncellenir.',
      h3Cell: '89283082803ffff',
      startsAt: startsAt,
      endsAt: startsAt.add(const Duration(hours: 2)),
      communityId: 'istanbul-riders',
      communityName: 'Istanbul Riders',
      currentRsvpStatus: FlareRsvpStatus.maybe,
      goingCount: id == 'garaj-bulusmasi' ? 11 : 18,
      maybeCount: 4,
      notGoingCount: 2,
      attendees: const [
        FlareAttendee(
          id: 'mert',
          username: 'mert_cb650r',
          displayName: 'Mert Yılmaz',
          rsvpStatus: FlareRsvpStatus.going,
        ),
        FlareAttendee(
          id: 'selin',
          username: 'selin_e30',
          displayName: 'Selin Arslan',
          rsvpStatus: FlareRsvpStatus.maybe,
        ),
        FlareAttendee(
          id: 'deniz',
          username: 'deniz_garage',
          displayName: 'Deniz Kaya',
          rsvpStatus: FlareRsvpStatus.going,
        ),
      ],
    );
  }

  Flare _flareWithRsvp(Flare flare, FlareRsvpStatus status) {
    var goingCount = flare.goingCount;
    var maybeCount = flare.maybeCount;
    var notGoingCount = flare.notGoingCount;

    switch (flare.currentRsvpStatus) {
      case FlareRsvpStatus.going:
        goingCount = _decrement(goingCount);
      case FlareRsvpStatus.maybe:
        maybeCount = _decrement(maybeCount);
      case FlareRsvpStatus.notGoing:
        notGoingCount = _decrement(notGoingCount);
      case null:
        break;
    }

    switch (status) {
      case FlareRsvpStatus.going:
        goingCount += 1;
      case FlareRsvpStatus.maybe:
        maybeCount += 1;
      case FlareRsvpStatus.notGoing:
        notGoingCount += 1;
    }

    return flare.copyWith(
      currentRsvpStatus: status,
      goingCount: goingCount,
      maybeCount: maybeCount,
      notGoingCount: notGoingCount,
    );
  }

  int _decrement(int value) => value <= 0 ? 0 : value - 1;

  String _extractErrorMessage(Object? data) {
    if (data is Map<String, dynamic>) {
      final error = data['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    return 'Flare bilgilerini kontrol et.';
  }
}
