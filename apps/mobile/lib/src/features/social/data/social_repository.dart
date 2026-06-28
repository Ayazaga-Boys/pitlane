import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/models/presence_status.dart';
import '../models/follow_status.dart';
import '../models/social_user.dart';
import '../models/social_user_page.dart';

final socialRepositoryProvider = Provider<SocialRepository>((ref) {
  return MockSocialRepository(
    responseDelay: AppConstants.useMockV2Social
        ? const Duration(milliseconds: 80)
        : Duration.zero,
  );
});

abstract interface class SocialRepository {
  Future<SocialUser> getUserByUsername(String username);

  Future<SocialUserPage> getFollowers(
    String username, {
    String? cursor,
    int limit = 20,
  });

  Future<SocialUserPage> getFollowing(
    String username, {
    String? cursor,
    int limit = 20,
  });

  Future<SocialUser> follow(String username);

  Future<SocialUser> unfollow(String username);
}

class MockSocialRepository implements SocialRepository {
  MockSocialRepository({this.responseDelay = Duration.zero})
      : _users = _seedUsers(),
        _followers = _seedFollowers(),
        _following = _seedFollowing();

  final Duration responseDelay;
  final Map<String, SocialUser> _users;
  final Map<String, List<SocialUser>> _followers;
  final Map<String, List<SocialUser>> _following;

  @override
  Future<SocialUser> getUserByUsername(String username) async {
    await _wait();
    final user = _users[username];
    if (user == null) throw const NotFoundException('Profil bulunamadı.');
    return user;
  }

  @override
  Future<SocialUserPage> getFollowers(
    String username, {
    String? cursor,
    int limit = 20,
  }) async {
    await getUserByUsername(username);
    return _page(_followers[username] ?? const [],
        cursor: cursor, limit: limit);
  }

  @override
  Future<SocialUserPage> getFollowing(
    String username, {
    String? cursor,
    int limit = 20,
  }) async {
    await getUserByUsername(username);
    return _page(_following[username] ?? const [],
        cursor: cursor, limit: limit);
  }

  @override
  Future<SocialUser> follow(String username) async {
    final user = await getUserByUsername(username);
    final nextStatus =
        user.isPrivate ? FollowStatus.requested : FollowStatus.following;
    final nextFollowers = nextStatus == FollowStatus.following
        ? user.followersCount + 1
        : user.followersCount;
    final updated = user.copyWith(
      followStatus: nextStatus,
      followersCount: nextFollowers,
    );
    _users[username] = updated;
    return updated;
  }

  @override
  Future<SocialUser> unfollow(String username) async {
    final user = await getUserByUsername(username);
    final nextFollowers = user.followStatus == FollowStatus.following
        ? (user.followersCount - 1).clamp(0, user.followersCount).toInt()
        : user.followersCount;
    final updated = user.copyWith(
      followStatus: FollowStatus.none,
      followersCount: nextFollowers,
    );
    _users[username] = updated;
    return updated;
  }

  Future<void> _wait() async {
    if (responseDelay == Duration.zero) return;
    await Future<void>.delayed(responseDelay);
  }

  SocialUserPage _page(
    List<SocialUser> source, {
    required String? cursor,
    required int limit,
  }) {
    final start = int.tryParse(cursor ?? '') ?? 0;
    final end = (start + limit).clamp(0, source.length).toInt();
    final items = source.sublist(start, end);
    final nextCursor = end < source.length ? end.toString() : null;

    return SocialUserPage(items: items, nextCursor: nextCursor);
  }

  static Map<String, SocialUser> _seedUsers() {
    const users = [
      SocialUser(
        id: 'mock-user-mert',
        username: 'mert_cb650r',
        displayName: 'Mert Yilmaz',
        bio: 'Hafta sonu rota, hafta ici garaj. CB650R ile Ege yollarindayim.',
        presenceStatus: PresenceStatus.online,
        followStatus: FollowStatus.none,
        followersCount: 128,
        followingCount: 84,
      ),
      SocialUser(
        id: 'mock-user-selin',
        username: 'selin_e30',
        displayName: 'Selin Arslan',
        bio: 'E30 restorasyon gunlugu ve temiz parca pesinde.',
        isPrivate: true,
        presenceStatus: PresenceStatus.dnd,
        followStatus: FollowStatus.none,
        followersCount: 312,
        followingCount: 140,
      ),
      SocialUser(
        id: 'mock-user-deniz',
        username: 'deniz_garage',
        displayName: 'Deniz Kaya',
        bio: 'Garaj, boya, mekanik ve yardim cagrilarina hizli cevap.',
        presenceStatus: PresenceStatus.offline,
        presenceVisible: false,
        followStatus: FollowStatus.following,
        followersCount: 540,
        followingCount: 219,
      ),
    ];

    return {
      for (final user in users) user.username: user,
    };
  }

  static Map<String, List<SocialUser>> _seedFollowers() {
    return {
      'mert_cb650r': const [
        SocialUser(
          id: 'mock-follower-1',
          username: 'ayse_garaj',
          displayName: 'Ayşe Garaj',
          bio: 'Garaj sohbeti ve rota planı.',
          presenceStatus: PresenceStatus.online,
          followStatus: FollowStatus.following,
          followersCount: 89,
          followingCount: 54,
        ),
        SocialUser(
          id: 'mock-follower-2',
          username: 'can_miata',
          displayName: 'Can Miata',
          bio: 'Viraj, bakım, lastik muhabbeti.',
          presenceStatus: PresenceStatus.dnd,
          followStatus: FollowStatus.none,
          followersCount: 205,
          followingCount: 91,
        ),
        SocialUser(
          id: 'mock-follower-3',
          username: 'efe_rider',
          displayName: 'Efe Rider',
          bio: 'Şehir dışı sürüşleri.',
          presenceStatus: PresenceStatus.offline,
          followersCount: 67,
          followingCount: 42,
        ),
        SocialUser(
          id: 'mock-follower-4',
          username: 'zeynep_gti',
          displayName: 'Zeynep GTI',
          bio: 'Hafta sonu pist günü.',
          presenceStatus: PresenceStatus.online,
          followersCount: 430,
          followingCount: 120,
        ),
        SocialUser(
          id: 'mock-follower-5',
          username: 'baran_touring',
          displayName: 'Baran Touring',
          bio: 'Uzun yol ve kamp ekipmanı.',
          presenceStatus: PresenceStatus.offline,
          presenceVisible: false,
          followersCount: 142,
          followingCount: 76,
        ),
      ],
      'selin_e30': const [
        SocialUser(
          id: 'mock-follower-6',
          username: 'mert_cb650r',
          displayName: 'Mert Yılmaz',
          presenceStatus: PresenceStatus.online,
          followStatus: FollowStatus.none,
          followersCount: 128,
          followingCount: 84,
        ),
      ],
      'deniz_garage': const [
        SocialUser(
          id: 'mock-follower-7',
          username: 'selin_e30',
          displayName: 'Selin Arslan',
          isPrivate: true,
          presenceStatus: PresenceStatus.dnd,
          followersCount: 312,
          followingCount: 140,
        ),
      ],
    };
  }

  static Map<String, List<SocialUser>> _seedFollowing() {
    return {
      'mert_cb650r': const [
        SocialUser(
          id: 'mock-following-1',
          username: 'deniz_garage',
          displayName: 'Deniz Kaya',
          bio: 'Garaj, boya, mekanik.',
          presenceStatus: PresenceStatus.offline,
          presenceVisible: false,
          followStatus: FollowStatus.following,
          followersCount: 540,
          followingCount: 219,
        ),
        SocialUser(
          id: 'mock-following-2',
          username: 'selin_e30',
          displayName: 'Selin Arslan',
          bio: 'E30 restorasyon günlüğü.',
          isPrivate: true,
          presenceStatus: PresenceStatus.dnd,
          followStatus: FollowStatus.requested,
          followersCount: 312,
          followingCount: 140,
        ),
        SocialUser(
          id: 'mock-following-3',
          username: 'ozan_detailing',
          displayName: 'Ozan Detailing',
          bio: 'Boya koruma ve iç temizlik.',
          presenceStatus: PresenceStatus.online,
          followStatus: FollowStatus.following,
          followersCount: 980,
          followingCount: 210,
        ),
        SocialUser(
          id: 'mock-following-4',
          username: 'lara_scrambler',
          displayName: 'Lara Scrambler',
          bio: 'Kıyı rotaları.',
          presenceStatus: PresenceStatus.online,
          followersCount: 221,
          followingCount: 180,
        ),
      ],
      'selin_e30': const [
        SocialUser(
          id: 'mock-following-5',
          username: 'deniz_garage',
          displayName: 'Deniz Kaya',
          presenceStatus: PresenceStatus.offline,
          followStatus: FollowStatus.following,
          followersCount: 540,
          followingCount: 219,
        ),
      ],
      'deniz_garage': const [
        SocialUser(
          id: 'mock-following-6',
          username: 'mert_cb650r',
          displayName: 'Mert Yılmaz',
          presenceStatus: PresenceStatus.online,
          followStatus: FollowStatus.following,
          followersCount: 128,
          followingCount: 84,
        ),
      ],
    };
  }
}
