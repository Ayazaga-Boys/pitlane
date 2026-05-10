import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../data/media_upload_repository.dart';
import '../models/snap_camera.dart';

class SnapCameraNotifier extends AsyncNotifier<SnapCameraState> {
  @override
  Future<SnapCameraState> build() async {
    return const SnapCameraState();
  }

  void setMode(SnapMode mode) {
    final current = state.valueOrNull ?? const SnapCameraState();
    state = AsyncData(current.copyWith(mode: mode));
  }

  void setFilter(SnapFilter filter) {
    final current = state.valueOrNull ?? const SnapCameraState();
    state = AsyncData(current.copyWith(filter: filter));
  }

  void setTarget(SnapTarget target) {
    final current = state.valueOrNull ?? const SnapCameraState();
    state = AsyncData(current.copyWith(target: target));
  }

  Future<void> refreshSpeed() async {
    final current = state.valueOrNull ?? const SnapCameraState();
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.best,
        timeLimit: const Duration(seconds: 4),
      );
      final speedKmh = (position.speed * 3.6).clamp(0, 240).toDouble();
      state = AsyncData(current.copyWith(speedKmh: speedKmh));
    } catch (_) {
      state = AsyncData(current.copyWith(speedKmh: 0));
    }
  }

  void capture({String? caption}) {
    final current = state.valueOrNull ?? const SnapCameraState();
    if (current.isVideoLocked) return;

    final draft = SnapDraft(
      mode: current.mode,
      filter: current.filter,
      target: current.target,
      speedKmh: current.speedKmh,
      caption: caption?.trim().isEmpty == true ? null : caption?.trim(),
    );

    state = AsyncData(
      current.copyWith(
        preview: SnapPreview(
          id: 'preview-${DateTime.now().millisecondsSinceEpoch}',
          draft: draft,
          createdAt: DateTime.now(),
        ),
        uploadProgress: 0,
        clearUploadedAsset: true,
      ),
    );
  }

  void retake() {
    final current = state.valueOrNull ?? const SnapCameraState();
    state = AsyncData(
      current.copyWith(clearPreview: true, uploadProgress: 0),
    );
  }

  Future<void> share() async {
    final current = state.valueOrNull;
    final preview = current?.preview;
    if (current == null || preview == null) return;

    state = AsyncData(current.copyWith(uploadProgress: 0.12));
    await Future<void>.delayed(const Duration(milliseconds: 120));

    final result = await ref
        .read(mediaUploadRepositoryProvider)
        .prepareUpload(preview.draft);

    state = AsyncData(current.copyWith(uploadProgress: 0.62));
    await Future<void>.delayed(const Duration(milliseconds: 120));
    state = AsyncData(
      current.copyWith(
        uploadProgress: 1,
        uploadedAssetId: result.assetId,
      ),
    );
  }
}

final snapCameraProvider =
    AsyncNotifierProvider<SnapCameraNotifier, SnapCameraState>(
  SnapCameraNotifier.new,
);
