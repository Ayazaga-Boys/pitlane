import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/providers/supabase_provider.dart';
import '../data/ws_service.dart';
import 'map_pins_provider.dart';

class FollowedUserLocation {
  const FollowedUserLocation({
    required this.userId,
    required this.h3Cell,
    this.status = WsPresenceStatus.offline,
  });

  final String userId;
  final String h3Cell;
  final WsPresenceStatus status;

  FollowedUserLocation copyWith({
    String? h3Cell,
    WsPresenceStatus? status,
  }) {
    return FollowedUserLocation(
      userId: userId,
      h3Cell: h3Cell ?? this.h3Cell,
      status: status ?? this.status,
    );
  }
}

class FollowedUsersRepository {
  FollowedUsersRepository(this._dio, this._readToken, this._readUserId);

  final Dio _dio;
  final String? Function() _readToken;
  final String? Function() _readUserId;

  String? get currentUserId => _readUserId();

  Future<List<String>> listFollowingIds() async {
    final userId = _readUserId();
    if (userId == null || userId.isEmpty) return const [];

    final response = await _dio.get<Map<String, dynamic>>(
      '/v2/follows/following',
      queryParameters: {
        'user_id': userId,
        'limit': 500,
      },
      options: Options(headers: _headers()),
    );
    final items = (response.data?['data'] as List<dynamic>?) ?? const [];
    return items
        .map(_extractFolloweeId)
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList(growable: false);
  }

  Map<String, String> _headers() {
    final token = _readToken();
    return {
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      if (AppConstants.isDev) 'x-dev-user-id': 'dev-user-map',
      if (AppConstants.isDev) 'x-dev-user-email': 'dev@rollpit.test',
    };
  }

  String? _extractFolloweeId(dynamic raw) {
    if (raw is! Map<String, dynamic>) return null;
    final followee = raw['followee'];
    if (followee is Map<String, dynamic>) {
      return followee['id'] as String?;
    }
    return raw['followee_id'] as String?;
  }
}

final followedUsersRepositoryProvider =
    Provider<FollowedUsersRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
      receiveTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  return FollowedUsersRepository(
    dio,
    () => supabase.auth.currentSession?.accessToken,
    () => supabase.auth.currentUser?.id,
  );
});

class FollowedUserLocationsNotifier
    extends Notifier<Map<String, FollowedUserLocation>> {
  StreamSubscription<WsLocationShareEvent>? _locationSub;
  StreamSubscription<WsPresenceEvent>? _presenceSub;
  final _subscribedUserIds = <String>{};
  String? _syncedForUserId;
  bool _syncing = false;

  @override
  Map<String, FollowedUserLocation> build() {
    final ws = ref.watch(wsServiceProvider);
    _locationSub = ws.locationShareStream.listen(_onLocationShare);
    _presenceSub = ws.presenceStream.listen(_onPresenceUpdate);
    ref.onDispose(() {
      _locationSub?.cancel();
      _presenceSub?.cancel();
    });
    return const {};
  }

  Future<void> syncFollowing() async {
    if (_syncing) return;
    final repository = ref.read(followedUsersRepositoryProvider);
    final userId = repository.currentUserId;
    if (userId == null || userId.isEmpty) return;
    if (_syncedForUserId == userId && _subscribedUserIds.isNotEmpty) return;

    _syncing = true;
    try {
      final nextIds = (await repository.listFollowingIds()).toSet();
      final ws = ref.read(wsServiceProvider);

      for (final staleId in _subscribedUserIds.difference(nextIds)) {
        ws.unsubscribeUser(staleId);
      }
      for (final userId in nextIds.difference(_subscribedUserIds)) {
        ws.subscribeUser(userId);
      }

      _subscribedUserIds
        ..clear()
        ..addAll(nextIds);
      _syncedForUserId = userId;
      state = Map.fromEntries(
        state.entries.where((entry) => nextIds.contains(entry.key)),
      );
    } finally {
      _syncing = false;
    }
  }

  void clear() {
    final ws = ref.read(wsServiceProvider);
    for (final userId in _subscribedUserIds) {
      ws.unsubscribeUser(userId);
    }
    _subscribedUserIds.clear();
    _syncedForUserId = null;
    state = const {};
  }

  void _onLocationShare(WsLocationShareEvent event) {
    if (!_subscribedUserIds.contains(event.userId)) return;
    final previous = state[event.userId];
    state = {
      ...state,
      event.userId: FollowedUserLocation(
        userId: event.userId,
        h3Cell: event.h3Cell,
        status: previous?.status ?? WsPresenceStatus.online,
      ),
    };
  }

  void _onPresenceUpdate(WsPresenceEvent event) {
    if (!_subscribedUserIds.contains(event.userId)) return;
    final previous = state[event.userId];
    if (previous == null) return;
    state = {
      ...state,
      event.userId: previous.copyWith(status: event.status),
    };
  }
}

final followedUserLocationsProvider = NotifierProvider<
    FollowedUserLocationsNotifier, Map<String, FollowedUserLocation>>(
  FollowedUserLocationsNotifier.new,
);

final followedUserPinsProvider = Provider<List<MapPin>>((ref) {
  final locations = ref.watch(followedUserLocationsProvider);
  return locations.values
      .where((location) => location.status != WsPresenceStatus.offline)
      .map(
        (location) => MapPin(
          id: 'followed-${location.userId}',
          type: MapPinType.followedUser,
          title: 'Takip edilen sürücü',
          subtitle: location.status == WsPresenceStatus.dnd
              ? 'Rahatsız etmeyin'
              : 'Çevrimiçi',
          position: h3ToLatLng(location.h3Cell),
          peerId: location.userId,
        ),
      )
      .toList(growable: false);
});
