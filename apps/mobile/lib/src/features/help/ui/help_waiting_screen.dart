import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../../map/ui/sos_pulse_widget.dart';
import '../models/help_request.dart';
import '../providers/help_request_provider.dart';

class HelpWaitingScreen extends ConsumerWidget {
  const HelpWaitingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final request = ref.watch(helpRequestProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Yardım Durumu')),
      body: SafeArea(
        child: request.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _HelpStateMessage(
            icon: Icons.error_outline,
            title: 'Yardım durumu alınamadı',
            message: error.toString(),
            actionLabel: 'Tekrar dene',
            onAction: () => ref.read(helpRequestProvider.notifier).refresh(),
          ),
          data: (item) {
            if (item == null) {
              return _HelpStateMessage(
                icon: Icons.sos_outlined,
                title: 'Açık yardım isteğin yok',
                message:
                    'Haritadaki SOS butonundan yeni bir istek açabilirsin.',
                actionLabel: 'Haritaya dön',
                onAction: () => context.go('/map'),
              );
            }
            return _HelpWaitingContent(request: item);
          },
        ),
      ),
    );
  }
}

class _HelpWaitingContent extends ConsumerWidget {
  const _HelpWaitingContent({required this.request});

  final HelpRequest request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(helpRequestProvider).isLoading;
    final expiresAt = DateFormat('HH:mm').format(request.expiresAt.toLocal());

    ref.listen(helpRequestProvider, (previous, next) {
      final value = next.valueOrNull;
      if (value?.status == HelpRequestStatus.cancelled) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Yardım isteği iptal edildi.')),
        );
        context.go('/map');
      }
    });

    return RefreshIndicator(
      onRefresh: () => ref.read(helpRequestProvider.notifier).refresh(),
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          const SizedBox(height: AppSpacing.xl),
          Center(
            child: SosPulseWidget(
              child: Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.sos, color: Colors.white, size: 36),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl2),
          Text(
            request.status.label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Yakındaki Pitlane üyeleri isteğini haritada görüyor.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: AppSpacing.xl2),
          _InfoTile(
            icon: Icons.build_outlined,
            title: '${request.issueType.emoji} ${request.issueType.label}',
            subtitle: 'Sorun tipi',
          ),
          const SizedBox(height: AppSpacing.md),
          _InfoTile(
            icon: Icons.grid_4x4,
            title: request.h3Cell,
            subtitle: 'Konum H3 hücresi',
          ),
          if (request.description != null &&
              request.description!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            _InfoTile(
              icon: Icons.notes_outlined,
              title: request.description!,
              subtitle: 'Açıklama',
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          _InfoTile(
            icon: Icons.timer_outlined,
            title: '$expiresAt saatine kadar açık',
            subtitle: 'Süre',
          ),
          const SizedBox(height: AppSpacing.xl2),
          if (request.helperId != null && request.helperId!.isNotEmpty) ...[
            PitlaneButton(
              label: 'Yardım Edene Mesaj Gönder',
              icon: Icons.chat_bubble_outline,
              onPressed: () => context.push('/messages/${request.helperId}'),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          PitlaneButton(
            label: 'İsteği İptal Et',
            icon: Icons.close,
            variant: PitlaneButtonVariant.destructive,
            isLoading: isLoading,
            onPressed: isLoading
                ? null
                : ref.read(helpRequestProvider.notifier).cancel,
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          children: [
            Icon(icon, color: AppColors.error),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textTertiary,
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

class _HelpStateMessage extends StatelessWidget {
  const _HelpStateMessage({
    required this.icon,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        const SizedBox(height: AppSpacing.xl3),
        Icon(icon, size: AppSpacing.xl3, color: AppColors.textTertiary),
        const SizedBox(height: AppSpacing.lg),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: AppSpacing.xl),
        PitlaneButton(label: actionLabel, onPressed: onAction),
      ],
    );
  }
}
