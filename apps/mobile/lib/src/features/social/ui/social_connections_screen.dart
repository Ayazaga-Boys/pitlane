import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/async_paged_list.dart';
import '../../../shared/widgets/user_list_tile_v2.dart';
import '../../../shared/widgets/v2_state_views.dart';
import '../models/social_user.dart';
import '../providers/social_connections_provider.dart';

class SocialConnectionsScreen extends ConsumerWidget {
  const SocialConnectionsScreen({
    super.key,
    required this.username,
    required this.kind,
  });

  final String username;
  final SocialConnectionKind kind;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final request = SocialConnectionsRequest(username: username, kind: kind);
    final connections = ref.watch(socialConnectionsProvider(request));

    return Scaffold(
      appBar: AppBar(title: Text(kind.title)),
      body: SafeArea(
        child: connections.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => V2ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(socialConnectionsProvider(request)),
          ),
          data: (state) => AsyncPagedList<SocialUser>(
            items: state.items,
            hasMore: state.hasMore,
            isLoadingMore: state.isLoadingMore,
            onLoadMore: () => ref
                .read(socialConnectionsProvider(request).notifier)
                .loadMore(),
            onRefresh: () =>
                ref.read(socialConnectionsProvider(request).notifier).refresh(),
            emptyState: V2EmptyState(
              icon: Icons.people_outline,
              title: kind.emptyTitle,
              scrollable: true,
            ),
            itemBuilder: (_, user, __) => UserListTileV2(
              displayName: user.displayName,
              username: user.username,
              avatarUrl: user.avatarUrl,
              subtitle: user.bio,
              presenceStatus: user.presenceStatus,
              presenceVisible: user.presenceVisible,
              onTap: () => context.push('/profile/${user.username}'),
            ),
          ),
        ),
      ),
    );
  }
}
