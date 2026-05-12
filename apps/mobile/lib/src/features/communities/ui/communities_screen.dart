import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/rollpit_text_field.dart';
import '../constants/community_constants.dart';
import '../models/community.dart';
import '../providers/communities_provider.dart';

class CommunitiesScreen extends ConsumerStatefulWidget {
  const CommunitiesScreen({super.key});

  @override
  ConsumerState<CommunitiesScreen> createState() => _CommunitiesScreenState();
}

class _CommunitiesScreenState extends ConsumerState<CommunitiesScreen> {
  final _searchController = TextEditingController();
  final _cityController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final communities = ref.watch(communitiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluklar'),
        actions: [
          IconButton(
            tooltip: 'Topluluk oluştur',
            onPressed: () => context.push('/communities/create'),
            icon: const Icon(Icons.add),
          ),
          IconButton(
            tooltip: 'Yenile',
            onPressed: () => ref.read(communitiesProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RollpitTextField(
                label: 'Ara',
                hint: 'Topluluk, slug veya açıklama',
                controller: _searchController,
                textInputAction: TextInputAction.search,
                onChanged: (value) {
                  ref.read(communitiesProvider.notifier).setQuery(value);
                },
              ),
              const SizedBox(height: AppSpacing.lg),
              RollpitTextField(
                label: 'Şehir',
                hint: 'İstanbul',
                controller: _cityController,
                maxLength: CommunityConstants.cityMaxLength,
                textInputAction: TextInputAction.done,
                onChanged: (value) {
                  ref.read(communitiesProvider.notifier).setCity(value);
                },
              ),
              const SizedBox(height: AppSpacing.lg),
              communities.maybeWhen(
                data: (state) => _VehicleFilter(filters: state.filters),
                orElse: () => const _VehicleFilter(filters: CommunityFilters()),
              ),
              const SizedBox(height: AppSpacing.xl),
              Expanded(
                child: communities.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, _) =>
                      _CommunitiesError(message: error.toString()),
                  data: (state) {
                    if (state.communities.isEmpty) {
                      return const _EmptyCommunities();
                    }
                    return RefreshIndicator(
                      onRefresh: () =>
                          ref.read(communitiesProvider.notifier).refresh(),
                      child: ListView.separated(
                        itemCount: state.communities.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: AppSpacing.md),
                        itemBuilder: (context, index) {
                          return _CommunityCard(
                            community: state.communities[index],
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VehicleFilter extends ConsumerWidget {
  const _VehicleFilter({required this.filters});

  final CommunityFilters filters;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: CommunityVehicleType.values.map((type) {
          final selected = filters.vehicleType == type;
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: ChoiceChip(
              label: Text(type.label),
              selected: selected,
              onSelected: (_) {
                ref.read(communitiesProvider.notifier).setVehicleType(type);
              },
              selectedColor: AppColors.pitRed,
              backgroundColor: AppColors.surface2,
              labelStyle: TextStyle(
                color:
                    selected ? AppColors.textPrimary : AppColors.textSecondary,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _CommunityCard extends StatelessWidget {
  const _CommunityCard({required this.community});

  final Community community;

  @override
  Widget build(BuildContext context) {
    final subtitle = [
      community.city,
      community.vehicleType.label,
      community.type.label,
    ].whereType<String>().join(' · ');

    return Semantics(
      button: true,
      label: '${community.name} topluluğu',
      child: Material(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.md),
          onTap: () => context.push('/communities/${community.slug}'),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.surface3),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _CommunityAvatar(community: community),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    community.name,
                                    style:
                                        Theme.of(context).textTheme.titleMedium,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (community.isVerified) ...[
                                  const SizedBox(width: AppSpacing.xs),
                                  const Icon(
                                    Icons.verified,
                                    color: AppColors.info,
                                    size: AppSpacing.lg,
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              '@${community.slug}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppColors.textTertiary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (community.description != null &&
                      community.description!.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      community.description!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textTertiary,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    children: [
                      const Icon(
                        Icons.group_outlined,
                        color: AppColors.textSecondary,
                        size: AppSpacing.lg,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        '${community.memberCount} üye',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const Spacer(),
                      if (community.lastActivityLabel != null)
                        Text(
                          community.lastActivityLabel!,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textTertiary,
                                  ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CommunityAvatar extends StatelessWidget {
  const _CommunityAvatar({required this.community});

  final Community community;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: AppSpacing.xl,
      backgroundColor: AppColors.surface3,
      backgroundImage:
          community.coverUrl == null ? null : NetworkImage(community.coverUrl!),
      child: community.coverUrl == null
          ? Icon(
              community.vehicleType == CommunityVehicleType.motorcycle
                  ? Icons.two_wheeler_outlined
                  : Icons.directions_car_outlined,
              color: AppColors.pitRed,
            )
          : null,
    );
  }
}

class _EmptyCommunities extends StatelessWidget {
  const _EmptyCommunities();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'Bu filtrelerle topluluk bulunamadı.',
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppColors.textSecondary,
            ),
      ),
    );
  }
}

class _CommunitiesError extends ConsumerWidget {
  const _CommunitiesError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.error,
                ),
          ),
          const SizedBox(height: AppSpacing.lg),
          TextButton.icon(
            onPressed: () => ref.invalidate(communitiesProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Tekrar dene'),
          ),
        ],
      ),
    );
  }
}
