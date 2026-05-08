import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../models/help_request.dart';
import '../providers/help_request_provider.dart';

class HelpDetailScreen extends ConsumerWidget {
  const HelpDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(helpDetailProvider(id));

    ref.listen(helpDetailProvider(id), (previous, next) {
      final error = next.error;
      if (error != null && previous?.isLoading == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(error.toString()),
              backgroundColor: AppColors.error),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Yardım Detayı')),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _HelpDetailError(message: error.toString()),
          data: (request) => _HelpDetailContent(request: request),
        ),
      ),
    );
  }
}

class _HelpDetailContent extends ConsumerWidget {
  const _HelpDetailContent({required this.request});

  final HelpRequest request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(helpDetailProvider(request.id)).isLoading;
    final expiresAt = DateFormat('HH:mm').format(request.expiresAt.toLocal());
    final canRespond = request.status == HelpRequestStatus.open;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.error.withAlpha(28),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Icon(Icons.sos, color: AppColors.error, size: 32),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    request.status.label,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  Text(
                    '${request.issueType.emoji} ${request.issueType.label}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        if (request.description != null && request.description!.isNotEmpty)
          _InfoTile(
            icon: Icons.notes_outlined,
            title: request.description!,
            subtitle: 'Talep açıklaması',
          ),
        const SizedBox(height: AppSpacing.md),
        _InfoTile(
          icon: Icons.grid_4x4,
          title: request.h3Cell,
          subtitle: 'Konum H3 hücresi',
        ),
        const SizedBox(height: AppSpacing.md),
        _InfoTile(
          icon: Icons.timer_outlined,
          title: '$expiresAt saatine kadar açık',
          subtitle: 'Yaklaşık süre',
        ),
        const SizedBox(height: AppSpacing.xl2),
        PitlaneButton(
          label: canRespond ? 'Yardım Edeceğim' : 'Mesaj Gönder',
          icon: canRespond
              ? Icons.volunteer_activism_outlined
              : Icons.chat_bubble_outline,
          isLoading: isLoading,
          onPressed: isLoading
              ? null
              : () async {
                  final responded = canRespond
                      ? await ref
                          .read(helpDetailProvider(request.id).notifier)
                          .respond()
                      : request;
                  if (!context.mounted || responded == null) return;
                  context.push('/messages/${responded.requesterId}');
                },
        ),
      ],
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

class _HelpDetailError extends StatelessWidget {
  const _HelpDetailError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.error,
              ),
        ),
      ),
    );
  }
}
