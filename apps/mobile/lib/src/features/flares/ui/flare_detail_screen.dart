import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/app_avatar.dart';
import '../../../shared/widgets/media_tile.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../models/flare.dart';
import '../providers/flare_detail_provider.dart';

class FlareDetailScreen extends ConsumerWidget {
  const FlareDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(flareDetailProvider(id));

    ref.listen(flareDetailProvider(id), (previous, next) {
      final error = next.error;
      if (error != null && previous?.isLoading == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Flare')),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _FlareDetailError(message: error.toString()),
          data: (flare) => _FlareDetailContent(flare: flare),
        ),
      ),
    );
  }
}

class _FlareDetailContent extends ConsumerWidget {
  const _FlareDetailContent({required this.flare});

  final Flare flare;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(flareDetailProvider(flare.id)).isLoading;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        if (flare.coverUrl != null && flare.coverUrl!.isNotEmpty) ...[
          MediaTile(
            url: flare.coverUrl,
            placeholderIcon: Icons.local_fire_department_outlined,
            semanticLabel: 'Flare kapak görseli',
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
        Row(
          children: [
            _StatusBadge(hasEnded: flare.hasEnded),
            if (flare.communityName != null) ...[
              const SizedBox(width: AppSpacing.sm),
              Flexible(
                child: Text(
                  flare.communityName!,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          flare.title,
          style: Theme.of(
            context,
          ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        if (flare.description != null && flare.description!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          Text(
            flare.description!,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        _InfoTile(
          icon: Icons.schedule,
          title: _formatDateRange(flare),
          subtitle: flare.hasEnded ? 'Etkinlik bitti' : 'Planlı buluşma',
        ),
        const SizedBox(height: AppSpacing.md),
        _InfoTile(
          icon: Icons.grid_4x4,
          title: flare.h3Cell,
          subtitle: 'Konum H3 hücresiyle saklanır',
        ),
        const SizedBox(height: AppSpacing.xl2),
        Text('RSVP', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.md),
        if (flare.hasEnded)
          const _MutedText('Etkinlik bittiği için RSVP kapalı.')
        else
          _RsvpSelector(
            selected: flare.currentRsvpStatus,
            isLoading: isLoading,
            onChanged: (status) => ref
                .read(flareDetailProvider(flare.id).notifier)
                .updateRsvp(status),
          ),
        const SizedBox(height: AppSpacing.lg),
        _RsvpCounts(flare: flare),
        const SizedBox(height: AppSpacing.md),
        RollpitButton(
          label: 'Flare sohbeti',
          variant: RollpitButtonVariant.secondary,
          onPressed: () => context.push('/flares/${flare.id}/chat'),
        ),
        const SizedBox(height: AppSpacing.xl2),
        Text('Katılımcılar', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.md),
        if (flare.attendees.isEmpty)
          const _MutedText('Katılımcı listesi henüz görünmüyor.')
        else
          ...flare.attendees.map((attendee) => _AttendeeTile(attendee)),
      ],
    );
  }

  String _formatDateRange(Flare flare) {
    final formatter = DateFormat('d MMM yyyy HH:mm');
    final start = formatter.format(flare.startsAt);
    if (flare.endsAt == null) return start;
    return '$start - ${formatter.format(flare.endsAt!)}';
  }
}

class _RsvpSelector extends StatelessWidget {
  const _RsvpSelector({
    required this.selected,
    required this.isLoading,
    required this.onChanged,
  });

  final FlareRsvpStatus? selected;
  final bool isLoading;
  final ValueChanged<FlareRsvpStatus> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<FlareRsvpStatus>(
      showSelectedIcon: false,
      selected: selected == null ? <FlareRsvpStatus>{} : {selected!},
      onSelectionChanged: isLoading
          ? null
          : (selection) {
              if (selection.isEmpty) return;
              onChanged(selection.first);
            },
      segments: const [
        ButtonSegment(
          value: FlareRsvpStatus.going,
          icon: Icon(Icons.check_circle_outline),
          label: Text('Gidiyorum'),
        ),
        ButtonSegment(
          value: FlareRsvpStatus.maybe,
          icon: Icon(Icons.help_outline),
          label: Text('Belki'),
        ),
        ButtonSegment(
          value: FlareRsvpStatus.notGoing,
          icon: Icon(Icons.cancel_outlined),
          label: Text('Gitmiyorum'),
        ),
      ],
    );
  }
}

class _RsvpCounts extends StatelessWidget {
  const _RsvpCounts({required this.flare});

  final Flare flare;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _CountPill(
            label: 'Giden',
            value: flare.goingCount,
            color: AppColors.success,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _CountPill(
            label: 'Belki',
            value: flare.maybeCount,
            color: AppColors.warning,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _CountPill(
            label: 'Değil',
            value: flare.notGoingCount,
            color: AppColors.textTertiary,
          ),
        ),
      ],
    );
  }
}

class _CountPill extends StatelessWidget {
  const _CountPill({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          children: [
            Text(
              '$value',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
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
      child: ListTile(
        leading: Icon(icon, color: AppColors.pitRed),
        title: Text(title),
        subtitle: Text(subtitle),
      ),
    );
  }
}

class _AttendeeTile extends StatelessWidget {
  const _AttendeeTile(this.attendee);

  final FlareAttendee attendee;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.surface3),
        ),
        child: ListTile(
          leading: AppAvatar(
            displayName: attendee.displayName,
            username: attendee.username,
            imageUrl: attendee.avatarUrl,
          ),
          title: Text(attendee.displayName),
          subtitle: Text(
            [
              if (attendee.username != null) '@${attendee.username}',
              attendee.rsvpStatus.label,
            ].join(' · '),
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.hasEnded});

  final bool hasEnded;

  @override
  Widget build(BuildContext context) {
    final color = hasEnded ? AppColors.textTertiary : AppColors.success;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: color.withAlpha(120)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        child: Text(
          hasEnded ? 'Etkinlik bitti' : 'Flare yayında',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color),
        ),
      ),
    );
  }
}

class _MutedText extends StatelessWidget {
  const _MutedText(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
    );
  }
}

class _FlareDetailError extends StatelessWidget {
  const _FlareDetailError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: AppColors.error),
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitButton(
              label: 'Geri dön',
              variant: RollpitButtonVariant.secondary,
              onPressed: () => Navigator.of(context).maybePop(),
            ),
          ],
        ),
      ),
    );
  }
}
