import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/community_constants.dart';
import '../data/community_repository.dart';
import '../models/community.dart';

class CommunitiesState {
  const CommunitiesState({
    this.communities = const [],
    this.filters = const CommunityFilters(),
  });

  final List<Community> communities;
  final CommunityFilters filters;

  CommunitiesState copyWith({
    List<Community>? communities,
    CommunityFilters? filters,
  }) {
    return CommunitiesState(
      communities: communities ?? this.communities,
      filters: filters ?? this.filters,
    );
  }
}

class CommunitiesNotifier extends AsyncNotifier<CommunitiesState> {
  Timer? _searchDebounce;

  @override
  Future<CommunitiesState> build() async {
    ref.onDispose(() => _searchDebounce?.cancel());
    final communities = await _fetch(const CommunityFilters());
    return CommunitiesState(communities: communities);
  }

  Future<void> setQuery(String query) async {
    final previous = state.valueOrNull ?? const CommunitiesState();
    state = AsyncData(previous.copyWith(
      filters: previous.filters.copyWith(query: query),
    ));

    _searchDebounce?.cancel();
    _searchDebounce = Timer(
      const Duration(milliseconds: CommunityConstants.searchDebounceMs),
      () => _refreshWithCurrentFilters(),
    );
  }

  Future<void> setCity(String city) async {
    final previous = state.valueOrNull ?? const CommunitiesState();
    state = AsyncData(previous.copyWith(
      filters: previous.filters.copyWith(city: city),
    ));
    await _refreshWithCurrentFilters();
  }

  Future<void> setVehicleType(CommunityVehicleType vehicleType) async {
    final previous = state.valueOrNull ?? const CommunitiesState();
    state = AsyncData(previous.copyWith(
      filters: previous.filters.copyWith(vehicleType: vehicleType),
    ));
    await _refreshWithCurrentFilters();
  }

  Future<void> refresh() async {
    await _refreshWithCurrentFilters();
  }

  Future<void> _refreshWithCurrentFilters() async {
    final previous = state.valueOrNull ?? const CommunitiesState();
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final communities = await _fetch(previous.filters);
      return previous.copyWith(communities: communities);
    });
  }

  Future<List<Community>> _fetch(CommunityFilters filters) {
    return ref.read(communityRepositoryProvider).listCommunities(filters);
  }
}

final communitiesProvider =
    AsyncNotifierProvider<CommunitiesNotifier, CommunitiesState>(
  CommunitiesNotifier.new,
);
