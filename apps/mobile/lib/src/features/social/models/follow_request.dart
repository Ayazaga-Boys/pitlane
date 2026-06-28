import 'social_user.dart';

class FollowRequest {
  const FollowRequest({
    required this.id,
    required this.user,
    required this.createdAtLabel,
  });

  final String id;
  final SocialUser user;
  final String createdAtLabel;
}
