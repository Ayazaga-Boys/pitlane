import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../models/snap_camera.dart';
import '../providers/snap_camera_provider.dart';

class SnapCameraScreen extends ConsumerStatefulWidget {
  const SnapCameraScreen({super.key});

  @override
  ConsumerState<SnapCameraScreen> createState() => _SnapCameraScreenState();
}

class _SnapCameraScreenState extends ConsumerState<SnapCameraScreen> {
  final _captionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(snapCameraProvider.notifier).refreshSpeed(),
    );
  }

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final camera = ref.watch(snapCameraProvider);

    ref.listen(snapCameraProvider, (previous, next) {
      final assetId = next.valueOrNull?.uploadedAssetId;
      final previousAssetId = previous?.valueOrNull?.uploadedAssetId;
      if (assetId != null && assetId != previousAssetId) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Snap hazır: $assetId')),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Snap Kamera')),
      body: SafeArea(
        child: camera.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text(error.toString())),
          data: (state) => _SnapCameraContent(
            state: state,
            captionController: _captionController,
          ),
        ),
      ),
    );
  }
}

class _SnapCameraContent extends ConsumerWidget {
  const _SnapCameraContent({
    required this.state,
    required this.captionController,
  });

  final SnapCameraState state;
  final TextEditingController captionController;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasPreview = state.preview != null;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        _ModeSelector(state: state),
        const SizedBox(height: AppSpacing.lg),
        _CameraStage(state: state),
        if (state.isVideoLocked) ...[
          const SizedBox(height: AppSpacing.md),
          const _SafetyBanner(),
        ],
        const SizedBox(height: AppSpacing.xl),
        if (!hasPreview) ...[
          _FilterSelector(state: state),
          const SizedBox(height: AppSpacing.lg),
          _TargetSelector(state: state),
          const SizedBox(height: AppSpacing.lg),
          TextField(
            controller: captionController,
            maxLength: 140,
            decoration: const InputDecoration(
              labelText: 'Kısa not',
              hintText: 'Rota, araç veya an bilgisi',
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: PitlaneButton(
                  label: 'Hızı Yenile',
                  icon: Icons.speed_outlined,
                  variant: PitlaneButtonVariant.secondary,
                  onPressed: () =>
                      ref.read(snapCameraProvider.notifier).refreshSpeed(),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: PitlaneButton(
                  label: state.mode == SnapMode.photo ? 'Çek' : 'Kaydet',
                  icon: state.mode == SnapMode.photo
                      ? Icons.camera_alt_outlined
                      : Icons.fiber_manual_record,
                  onPressed: state.isVideoLocked
                      ? null
                      : () => ref
                          .read(snapCameraProvider.notifier)
                          .capture(caption: captionController.text),
                ),
              ),
            ],
          ),
        ] else ...[
          _PreviewActions(state: state),
        ],
      ],
    );
  }
}

class _ModeSelector extends ConsumerWidget {
  const _ModeSelector({required this.state});

  final SnapCameraState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SegmentedButton<SnapMode>(
      selected: {state.mode},
      showSelectedIcon: false,
      onSelectionChanged: (selection) {
        ref.read(snapCameraProvider.notifier).setMode(selection.first);
      },
      segments: const [
        ButtonSegment(
          value: SnapMode.photo,
          icon: Icon(Icons.photo_camera_outlined),
          label: Text('Foto'),
        ),
        ButtonSegment(
          value: SnapMode.video,
          icon: Icon(Icons.videocam_outlined),
          label: Text('Video'),
        ),
      ],
    );
  }
}

class _CameraStage extends StatelessWidget {
  const _CameraStage({required this.state});

  final SnapCameraState state;

  @override
  Widget build(BuildContext context) {
    final preview = state.preview;

    return AspectRatio(
      aspectRatio: 9 / 16,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.surface3),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.surface3,
                      AppColors.surface1,
                      AppColors.surface0,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              top: AppSpacing.lg,
              left: AppSpacing.lg,
              child: _OverlayPill(
                icon: state.mode == SnapMode.photo
                    ? Icons.photo_camera_outlined
                    : Icons.videocam_outlined,
                label: state.mode.label,
              ),
            ),
            Positioned(
              top: AppSpacing.lg,
              right: AppSpacing.lg,
              child: _OverlayPill(
                icon: Icons.speed_outlined,
                label: '${state.speedKmh.toStringAsFixed(0)} km/h',
              ),
            ),
            Center(
              child: Icon(
                preview == null
                    ? Icons.camera_alt_outlined
                    : Icons.check_circle_outline,
                color: preview == null
                    ? AppColors.textTertiary
                    : AppColors.success,
                size: 72,
              ),
            ),
            Positioned(
              left: AppSpacing.lg,
              right: AppSpacing.lg,
              bottom: AppSpacing.lg,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _OverlayPill(
                    icon: Icons.filter_alt_outlined,
                    label: state.filter.label,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  if (preview?.draft.caption != null)
                    Text(
                      preview!.draft.caption!,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                    )
                  else
                    Text(
                      'Çekim önizlemesi',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterSelector extends ConsumerWidget {
  const _FilterSelector({required this.state});

  final SnapCameraState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _ChoiceWrap(
      title: 'Filtre',
      children: SnapFilter.values.map((filter) {
        return ChoiceChip(
          selected: state.filter == filter,
          label: Text(filter.label),
          onSelected: (_) =>
              ref.read(snapCameraProvider.notifier).setFilter(filter),
        );
      }).toList(growable: false),
    );
  }
}

class _TargetSelector extends ConsumerWidget {
  const _TargetSelector({required this.state});

  final SnapCameraState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _ChoiceWrap(
      title: 'Paylaşım hedefi',
      children: SnapTarget.values.map((target) {
        return ChoiceChip(
          selected: state.target == target,
          label: Text(target.label),
          onSelected: (_) =>
              ref.read(snapCameraProvider.notifier).setTarget(target),
        );
      }).toList(growable: false),
    );
  }
}

class _PreviewActions extends ConsumerWidget {
  const _PreviewActions({required this.state});

  final SnapCameraState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uploadProgress = state.uploadProgress;
    final isUploading = uploadProgress > 0 && uploadProgress < 1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (uploadProgress > 0) ...[
          LinearProgressIndicator(value: uploadProgress),
          const SizedBox(height: AppSpacing.sm),
          Text(
            uploadProgress >= 1
                ? 'Yükleme hazırlandı'
                : 'Yükleme hazırlanıyor...',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
        Row(
          children: [
            Expanded(
              child: PitlaneButton(
                label: 'Yeniden Çek',
                icon: Icons.refresh,
                variant: PitlaneButtonVariant.secondary,
                onPressed: isUploading
                    ? null
                    : ref.read(snapCameraProvider.notifier).retake,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: PitlaneButton(
                label: 'Paylaş',
                icon: Icons.upload_outlined,
                isLoading: isUploading,
                onPressed: isUploading
                    ? null
                    : ref.read(snapCameraProvider.notifier).share,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ChoiceWrap extends StatelessWidget {
  const _ChoiceWrap({
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: children,
        ),
      ],
    );
  }
}

class _SafetyBanner extends StatelessWidget {
  const _SafetyBanner();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.warning.withAlpha(24),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.warning.withAlpha(90)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_outlined, color: AppColors.warning),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                '10 km/s üzerindeyken video kaydı kilitlenir.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverlayPill extends StatelessWidget {
  const _OverlayPill({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface0.withAlpha(190),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.pitRed, size: 18),
            const SizedBox(width: AppSpacing.xs),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
