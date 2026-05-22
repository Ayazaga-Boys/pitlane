import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/profile_repository.dart';
import '../constants/profile_constants.dart';
import '../models/rollpit_profile.dart';
import '../models/vehicle.dart';

enum ProfileCompletionStep {
  identity,
  vehicle,
  permissions,
  rules,
  done,
}

class ProfileCompletionState {
  const ProfileCompletionState({
    this.step = ProfileCompletionStep.identity,
    this.profile,
    this.vehicles = const [],
    this.locationPermissionAcknowledged = false,
    this.notificationPermissionAcknowledged = false,
    this.rulesAccepted = false,
  });

  final ProfileCompletionStep step;
  final RollpitProfile? profile;
  final List<Vehicle> vehicles;
  final bool locationPermissionAcknowledged;
  final bool notificationPermissionAcknowledged;
  final bool rulesAccepted;

  double get progress {
    return switch (step) {
      ProfileCompletionStep.identity => ProfileConstants.progressIdentity,
      ProfileCompletionStep.vehicle => ProfileConstants.progressVehicle,
      ProfileCompletionStep.permissions => ProfileConstants.progressPermissions,
      ProfileCompletionStep.rules => ProfileConstants.progressRules,
      ProfileCompletionStep.done => ProfileConstants.progressDone,
    };
  }

  ProfileCompletionState copyWith({
    ProfileCompletionStep? step,
    RollpitProfile? profile,
    List<Vehicle>? vehicles,
    bool? locationPermissionAcknowledged,
    bool? notificationPermissionAcknowledged,
    bool? rulesAccepted,
  }) {
    return ProfileCompletionState(
      step: step ?? this.step,
      profile: profile ?? this.profile,
      vehicles: vehicles ?? this.vehicles,
      locationPermissionAcknowledged:
          locationPermissionAcknowledged ?? this.locationPermissionAcknowledged,
      notificationPermissionAcknowledged: notificationPermissionAcknowledged ??
          this.notificationPermissionAcknowledged,
      rulesAccepted: rulesAccepted ?? this.rulesAccepted,
    );
  }
}

class ProfileCompletionNotifier extends AsyncNotifier<ProfileCompletionState> {
  @override
  Future<ProfileCompletionState> build() async {
    final repository = ref.read(profileRepositoryProvider);
    final profile = await repository.getCurrentProfile();
    final vehicles = await AsyncValue.guard(repository.getVehicles).then(
      (value) => value.valueOrNull ?? const <Vehicle>[],
    );

    return ProfileCompletionState(
      profile: profile,
      vehicles: vehicles,
      step: _resolveInitialStep(profile, vehicles),
    );
  }

  Future<void> saveIdentity({
    required String username,
    required String displayName,
    String? avatarUrl,
  }) async {
    final previous = state.valueOrNull ?? const ProfileCompletionState();
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final profile = await ref.read(profileRepositoryProvider).updateProfile(
            username: username,
            displayName: displayName,
            avatarUrl: avatarUrl,
          );
      return previous.copyWith(
        profile: profile,
        step: ProfileCompletionStep.vehicle,
      );
    });
  }

  Future<void> addVehicle({
    required VehicleType type,
    required String make,
    required String model,
    int? year,
    String? color,
    String? iconSlug,
  }) async {
    final previous = state.valueOrNull ?? const ProfileCompletionState();
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final vehicle = await ref.read(profileRepositoryProvider).addVehicle(
            type: type,
            make: make,
            model: model,
            year: year,
            color: color,
            iconSlug: iconSlug,
          );
      final vehicleWithLocalIcon = Vehicle(
        id: vehicle.id,
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        photoUrl: vehicle.photoUrl,
        iconSlug: vehicle.iconSlug ?? iconSlug,
        isPrimary: vehicle.isPrimary,
      );
      return previous.copyWith(
        vehicles: [vehicleWithLocalIcon, ...previous.vehicles],
        step: ProfileCompletionStep.permissions,
      );
    });
  }

  Future<void> setPrimaryVehicle(String vehicleId) async {
    final previous = state.valueOrNull ?? const ProfileCompletionState();
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(profileRepositoryProvider).setPrimaryVehicle(vehicleId);
      return previous.copyWith(
        vehicles: previous.vehicles
            .map(
              (vehicle) => Vehicle(
                id: vehicle.id,
                type: vehicle.type,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                color: vehicle.color,
                photoUrl: vehicle.photoUrl,
                iconSlug: vehicle.iconSlug,
                isPrimary: vehicle.id == vehicleId,
              ),
            )
            .toList(growable: false),
      );
    });
  }

  void continueFromPermissions() {
    final previous = state.valueOrNull ?? const ProfileCompletionState();
    state = AsyncData(
      previous.copyWith(
        step: ProfileCompletionStep.rules,
        locationPermissionAcknowledged: true,
        notificationPermissionAcknowledged: true,
      ),
    );
  }

  void acceptRules() {
    final previous = state.valueOrNull ?? const ProfileCompletionState();
    state = AsyncData(
      previous.copyWith(
        step: ProfileCompletionStep.done,
        rulesAccepted: true,
      ),
    );
  }

  void goTo(ProfileCompletionStep step) {
    final previous = state.valueOrNull ?? const ProfileCompletionState();
    state = AsyncData(previous.copyWith(step: step));
  }

  ProfileCompletionStep _resolveInitialStep(
    RollpitProfile? profile,
    List<Vehicle> vehicles,
  ) {
    if (profile?.hasCompletedIdentity != true) {
      return ProfileCompletionStep.identity;
    }
    if (vehicles.isEmpty) return ProfileCompletionStep.vehicle;
    return ProfileCompletionStep.permissions;
  }
}

final profileCompletionProvider =
    AsyncNotifierProvider<ProfileCompletionNotifier, ProfileCompletionState>(
  ProfileCompletionNotifier.new,
);
