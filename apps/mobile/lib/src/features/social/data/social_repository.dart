import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/models/presence_status.dart';
import '../models/follow_status.dart';
import '../models/social_user.dart';

final socialRepositoryProvider = Provider<SocialRepository>((ref) {
  return MockSocialRepository(
    responseDelay: AppConstants.useMockV2Social
        ? const Duration(milliseconds: 80)
        : Duration.zero,
  );
});

abstract interface class SocialRepository {
  Future<SocialUser> getUserByUsername(String username);

  Future<SocialUser> follow(String username);

  Future<SocialUser> unfollow(String username);
}

class MockSocialRepository implements SocialRepository {
  MockSocialRepository({this.responseDelay = Duration.zero})
      : _users = _seedUsers();

  final Duration responseDelay;
  final Map<String, SocialUser> _users;

  @override
  Future<SocialUser> getUserByUsername(String username) async {
    await _wait();
    final user = _users[username];
    if (user == null) throw const NotFoundException('Profil bulunamadı.');
    return user;
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
}
