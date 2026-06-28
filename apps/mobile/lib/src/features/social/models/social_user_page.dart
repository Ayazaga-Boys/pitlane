import 'social_user.dart';

class SocialUserPage {
  const SocialUserPage({
    required this.items,
    required this.nextCursor,
  });

  final List<SocialUser> items;
  final String? nextCursor;
}
