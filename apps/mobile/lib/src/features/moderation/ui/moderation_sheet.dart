import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../models/moderation.dart';
import '../providers/moderation_provider.dart';

Future<void> showModerationSheet(
  BuildContext context, {
  required WidgetRef ref,
  required ModerationTarget target,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => _ModerationSheet(target: target),
  );
}

class _ModerationSheet extends ConsumerWidget {
  const _ModerationSheet({required this.target});

  final ModerationTarget target;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canBlock = target.userId != null && target.userId!.isNotEmpty;

    ref.listen(moderationProvider, (previous, next) {
      final error = next.error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.xl,
          right: AppSpacing.xl,
          top: AppSpacing.xl,
          bottom: MediaQuery.viewInsetsOf(context).bottom + AppSpacing.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(target.label, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Güvenlik işlemi seç',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xl),
            RollpitButton(
              label: 'Şikayet et',
              variant: RollpitButtonVariant.secondary,
              icon: Icons.flag_outlined,
              onPressed: () {
                Navigator.of(context).pop();
                _showReportDialog(context, target);
              },
            ),
            if (canBlock) ...[
              const SizedBox(height: AppSpacing.md),
              RollpitButton(
                label: 'Engelle',
                variant: RollpitButtonVariant.destructive,
                icon: Icons.block,
                onPressed: () {
                  Navigator.of(context).pop();
                  _showBlockDialog(context, ref, target);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

Future<void> _showReportDialog(BuildContext context, ModerationTarget target) {
  return showDialog<void>(
    context: context,
    builder: (_) => _ReportDialog(target: target),
  );
}

Future<void> _showBlockDialog(
  BuildContext context,
  WidgetRef ref,
  ModerationTarget target,
) {
  return showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Engelle'),
      content: Text(
        '${target.label} kullanıcısını engellemek istediğinden emin misin?',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Vazgeç'),
        ),
        FilledButton(
          onPressed: () async {
            Navigator.of(dialogContext).pop();
            await ref
                .read(moderationProvider.notifier)
                .blockUser(target.userId!);
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Kullanıcı engellendi.')),
            );
            Navigator.of(context).maybePop();
          },
          child: const Text('Engelle'),
        ),
      ],
    ),
  );
}

class _ReportDialog extends ConsumerStatefulWidget {
  const _ReportDialog({required this.target});

  final ModerationTarget target;

  @override
  ConsumerState<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends ConsumerState<_ReportDialog> {
  final _descriptionController = TextEditingController();
  ReportReason _reason = ReportReason.spam;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    await ref.read(moderationProvider.notifier).report(
          CreateReportDraft(
            target: widget.target,
            reason: _reason,
            description: _descriptionController.text,
          ),
        );
    if (!mounted) return;
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Teşekkürler, 24 saat içinde inceleyeceğiz.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(moderationProvider).isLoading;

    return AlertDialog(
      title: const Text('Şikayet et'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final reason in ReportReason.values)
              ListTile(
                enabled: !isLoading,
                leading: Icon(
                  _reason == reason
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: _reason == reason ? AppColors.pitRed : null,
                ),
                title: Text(reason.label),
                onTap:
                    isLoading ? null : () => setState(() => _reason = reason),
              ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _descriptionController,
              maxLength: 500,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Açıklama',
                hintText: 'İstersen kısa bir not ekle',
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('Vazgeç'),
        ),
        FilledButton(
          onPressed: isLoading ? null : _submit,
          child: isLoading
              ? const SizedBox.square(
                  dimension: AppSpacing.lg,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Gönder'),
        ),
      ],
    );
  }
}
