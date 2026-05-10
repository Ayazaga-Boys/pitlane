enum SnapMode {
  photo('photo', 'Fotoğraf'),
  video('video', 'Video');

  const SnapMode(this.apiValue, this.label);

  final String apiValue;
  final String label;
}

enum SnapFilter {
  clean('Temiz'),
  speed('Hız'),
  gear('Vites'),
  compass('Pusula'),
  cinematic('Cinematic'),
  vintage('Vintage'),
  warm('Warm');

  const SnapFilter(this.label);

  final String label;
}

enum SnapTarget {
  profile('Profil galerisi'),
  community('Topluluk'),
  flare('Flare'),
  dm('DM');

  const SnapTarget(this.label);

  final String label;
}

class SnapDraft {
  const SnapDraft({
    required this.mode,
    required this.filter,
    required this.target,
    required this.speedKmh,
    this.caption,
  });

  final SnapMode mode;
  final SnapFilter filter;
  final SnapTarget target;
  final double speedKmh;
  final String? caption;

  String get filename {
    final extension = mode == SnapMode.photo ? 'jpg' : 'mp4';
    return 'snap-${DateTime.now().millisecondsSinceEpoch}.$extension';
  }

  String get contentType {
    return mode == SnapMode.photo ? 'image/jpeg' : 'video/mp4';
  }
}

class SnapPreview {
  const SnapPreview({
    required this.id,
    required this.draft,
    required this.createdAt,
  });

  final String id;
  final SnapDraft draft;
  final DateTime createdAt;
}

class SnapUploadResult {
  const SnapUploadResult({
    required this.assetId,
    this.uploadUrl,
  });

  final String assetId;
  final String? uploadUrl;
}

class SnapCameraState {
  const SnapCameraState({
    this.mode = SnapMode.photo,
    this.filter = SnapFilter.clean,
    this.target = SnapTarget.profile,
    this.speedKmh = 0,
    this.preview,
    this.uploadProgress = 0,
    this.uploadedAssetId,
  });

  final SnapMode mode;
  final SnapFilter filter;
  final SnapTarget target;
  final double speedKmh;
  final SnapPreview? preview;
  final double uploadProgress;
  final String? uploadedAssetId;

  bool get isVideoLocked => mode == SnapMode.video && speedKmh > 10;

  SnapCameraState copyWith({
    SnapMode? mode,
    SnapFilter? filter,
    SnapTarget? target,
    double? speedKmh,
    SnapPreview? preview,
    bool clearPreview = false,
    double? uploadProgress,
    String? uploadedAssetId,
    bool clearUploadedAsset = false,
  }) {
    return SnapCameraState(
      mode: mode ?? this.mode,
      filter: filter ?? this.filter,
      target: target ?? this.target,
      speedKmh: speedKmh ?? this.speedKmh,
      preview: clearPreview ? null : preview ?? this.preview,
      uploadProgress: uploadProgress ?? this.uploadProgress,
      uploadedAssetId:
          clearUploadedAsset ? null : uploadedAssetId ?? this.uploadedAssetId,
    );
  }
}
