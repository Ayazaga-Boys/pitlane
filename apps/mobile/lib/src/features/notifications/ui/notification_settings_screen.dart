import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/notifications_provider.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(notificationPreferencesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Bildirim ayarları')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _PreferenceSwitch(
              title: 'Yakındaki yardım çağrıları',
              subtitle: 'Kritik yardım talepleri için yüksek öncelik.',
              value: prefs.helpNearby,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(helpNearby: value)),
            ),
            _PreferenceSwitch(
              title: 'Yardımcı yaklaştı',
              subtitle: 'Yardım talebinde konum güncellemeleri.',
              value: prefs.helpHelperArrived,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(helpHelperArrived: value)),
            ),
            _PreferenceSwitch(
              title: 'Flare davetleri',
              subtitle: 'Toplulukların yeni buluşma davetleri.',
              value: prefs.flareInvite,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(flareInvite: value)),
            ),
            _PreferenceSwitch(
              title: 'Flare başlıyor',
              subtitle: 'Katıldığın etkinlik başlamadan önce hatırlatma.',
              value: prefs.flareStarting,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(flareStarting: value)),
            ),
            _PreferenceSwitch(
              title: 'Yeni DM',
              subtitle: 'Birebir mesaj bildirimleri.',
              value: prefs.dmNew,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(dmNew: value)),
            ),
            _PreferenceSwitch(
              title: 'Topluluk mesajları',
              subtitle: 'Takip ettiğin topluluk odalarındaki yeni mesajlar.',
              value: prefs.communityMessage,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(communityMessage: value)),
            ),
            _PreferenceSwitch(
              title: 'Topluluk davetleri',
              subtitle: 'Yeni topluluk davetleri ve rol değişiklikleri.',
              value: prefs.communityInvite,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(communityInvite: value)),
            ),
            _PreferenceSwitch(
              title: 'Sistem',
              subtitle: 'Güvenlik ve hesap bildirimleri.',
              value: prefs.system,
              onChanged: (value) => ref
                  .read(notificationPreferencesProvider.notifier)
                  .update(prefs.copyWith(system: value)),
            ),
          ],
        ),
      ),
    );
  }
}

class _PreferenceSwitch extends StatelessWidget {
  const _PreferenceSwitch({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

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
        child: SwitchListTile(
          value: value,
          onChanged: onChanged,
          title: Text(title),
          subtitle: Text(subtitle),
        ),
      ),
    );
  }
}
