import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

enum MediaTileType { image, video }

class MediaTile extends StatefulWidget {
  const MediaTile({
    super.key,
    this.url,
    this.thumbnailUrl,
    this.type = MediaTileType.image,
    this.aspectRatio = 16 / 9,
    this.placeholderIcon,
    this.semanticLabel,
  });

  final String? url;
  final String? thumbnailUrl;
  final MediaTileType type;
  final double aspectRatio;
  final IconData? placeholderIcon;
  final String? semanticLabel;

  @override
  State<MediaTile> createState() => _MediaTileState();
}

class _MediaTileState extends State<MediaTile> {
  var _retryKey = 0;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: widget.semanticLabel ?? _defaultSemanticLabel,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: AspectRatio(
          aspectRatio: widget.aspectRatio,
          child: _content,
        ),
      ),
    );
  }

  Widget get _content {
    final source = _source;
    if (source == null) {
      return _Placeholder(
        icon: widget.placeholderIcon ?? _defaultPlaceholderIcon,
        showPlay: widget.type == MediaTileType.video,
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Image.network(
          source,
          key: ValueKey('media-$source-$_retryKey'),
          fit: BoxFit.cover,
          gaplessPlayback: true,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return const _LoadingPlaceholder();
          },
          errorBuilder: (_, __, ___) => _ErrorPlaceholder(
            onRetry: () => setState(() => _retryKey++),
          ),
        ),
        if (widget.type == MediaTileType.video) const _PlayOverlay(),
      ],
    );
  }

  String? get _source {
    final thumbnailUrl = widget.thumbnailUrl;
    if (thumbnailUrl != null && thumbnailUrl.isNotEmpty) return thumbnailUrl;
    final url = widget.url;
    if (url != null && url.isNotEmpty) return url;
    return null;
  }

  IconData get _defaultPlaceholderIcon {
    return switch (widget.type) {
      MediaTileType.image => Icons.image_outlined,
      MediaTileType.video => Icons.videocam_outlined,
    };
  }

  String get _defaultSemanticLabel {
    return switch (widget.type) {
      MediaTileType.image => 'Görsel medya',
      MediaTileType.video => 'Video medya',
    };
  }
}

class _LoadingPlaceholder extends StatelessWidget {
  const _LoadingPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(color: AppColors.surface3),
      child: Center(
        child: SizedBox.square(
          dimension: AppSpacing.xl,
          child: CircularProgressIndicator(strokeWidth: AppSpacing.xs2),
        ),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({
    required this.icon,
    required this.showPlay,
  });

  final IconData icon;
  final bool showPlay;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: AppColors.surface3),
      child: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(icon, color: AppColors.textSecondary, size: AppSpacing.xl3),
            if (showPlay) const _PlayOverlay(),
          ],
        ),
      ),
    );
  }
}

class _ErrorPlaceholder extends StatelessWidget {
  const _ErrorPlaceholder({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: AppColors.surface3),
      child: Center(
        child: IconButton(
          tooltip: 'Medyayı tekrar yükle',
          icon: const Icon(Icons.refresh),
          color: AppColors.textSecondary,
          onPressed: onRetry,
        ),
      ),
    );
  }
}

class _PlayOverlay extends StatelessWidget {
  const _PlayOverlay();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface0.withAlpha(180),
          shape: BoxShape.circle,
        ),
        child: const Padding(
          padding: EdgeInsets.all(AppSpacing.sm),
          child: Icon(Icons.play_arrow, color: AppColors.textPrimary),
        ),
      ),
    );
  }
}
