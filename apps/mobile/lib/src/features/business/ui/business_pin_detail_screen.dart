import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../models/business_pin.dart';
import '../providers/business_pin_provider.dart';

class BusinessPinDetailScreen extends ConsumerWidget {
  const BusinessPinDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(businessPinDetailProvider(id));

    return Scaffold(
      appBar: AppBar(title: const Text('İşletme')),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _BusinessPinError(message: error.toString()),
          data: (pin) => RefreshIndicator(
            onRefresh: () =>
                ref.read(businessPinDetailProvider(id).notifier).refresh(),
            child: _BusinessPinDetailContent(pin: pin),
          ),
        ),
      ),
    );
  }
}

class _BusinessPinDetailContent extends StatelessWidget {
  const _BusinessPinDetailContent({required this.pin});

  final BusinessPin pin;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        _CoverHeader(pin: pin),
        const SizedBox(height: AppSpacing.xl),
        Row(
          children: [
            Expanded(
              child: Text(
                pin.name,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            if (pin.isVerified) const _VerifiedBadge(),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          pin.category.label,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        if (!pin.isActive) ...[
          const SizedBox(height: AppSpacing.md),
          const _StatusBanner(
            icon: Icons.info_outline,
            text: 'Bu işletme şu anda aktif görünmüyor.',
            color: AppColors.warning,
          ),
        ],
        if (pin.hasCampaign) ...[
          const SizedBox(height: AppSpacing.lg),
          _CampaignBanner(pin: pin),
        ],
        const SizedBox(height: AppSpacing.xl2),
        _InfoTile(
          icon: Icons.grid_4x4,
          title: pin.h3Cell.isEmpty ? 'Konum bekleniyor' : pin.h3Cell,
          subtitle: 'Konum H3 hücresiyle saklanır',
        ),
        if (pin.address != null && pin.address!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          _InfoTile(
            icon: Icons.place_outlined,
            title: pin.address!,
            subtitle: 'Adres',
          ),
        ],
        if (pin.phone != null && pin.phone!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          _InfoTile(
            icon: Icons.call_outlined,
            title: pin.phone!,
            subtitle: 'Telefon',
          ),
        ],
        if (pin.website != null && pin.website!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          _InfoTile(
            icon: Icons.public,
            title: pin.website!,
            subtitle: 'Web sitesi',
          ),
        ],
        const SizedBox(height: AppSpacing.xl2),
        PitlaneButton(
          label: 'Yol Tarifi Al',
          icon: Icons.directions_outlined,
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Yol tarifi bağlantısı harita modülüne hazır.'),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _CoverHeader extends StatelessWidget {
  const _CoverHeader({required this.pin});

  final BusinessPin pin;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          image: pin.coverUrl == null || pin.coverUrl!.isEmpty
              ? null
              : DecorationImage(
                  image: NetworkImage(pin.coverUrl!),
                  fit: BoxFit.cover,
                ),
        ),
        child: Align(
          alignment: Alignment.bottomLeft,
          child: Container(
            width: 72,
            height: 72,
            margin: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.surface3,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.surface0, width: 3),
              image: pin.logoUrl == null || pin.logoUrl!.isEmpty
                  ? null
                  : DecorationImage(
                      image: NetworkImage(pin.logoUrl!),
                      fit: BoxFit.cover,
                    ),
            ),
            child: pin.logoUrl == null || pin.logoUrl!.isEmpty
                ? const Icon(
                    Icons.storefront_outlined,
                    color: AppColors.pitRed,
                    size: AppSpacing.xl2,
                  )
                : null,
          ),
        ),
      ),
    );
  }
}

class _VerifiedBadge extends StatelessWidget {
  const _VerifiedBadge();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.success.withAlpha(28),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.success.withAlpha(110)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.verified, color: AppColors.success, size: 18),
            const SizedBox(width: AppSpacing.xs),
            Text(
              'Onaylı',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CampaignBanner extends StatelessWidget {
  const _CampaignBanner({required this.pin});

  final BusinessPin pin;

  @override
  Widget build(BuildContext context) {
    final endsAt = pin.campaignEndsAt;
    final endLabel = endsAt == null
        ? null
        : DateFormat('d MMM HH:mm').format(endsAt.toLocal());

    return _StatusBanner(
      icon: Icons.local_offer_outlined,
      text: endLabel == null
          ? pin.campaignText!
          : '${pin.campaignText!}\n$endLabel tarihine kadar',
      color: AppColors.pitRed,
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.text,
    required this.color,
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withAlpha(24),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: color.withAlpha(90)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                text,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                    ),
              ),
            ),
          ],
        ),
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
            Icon(icon, color: AppColors.pitRed),
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

class _BusinessPinError extends StatelessWidget {
  const _BusinessPinError({required this.message});

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
