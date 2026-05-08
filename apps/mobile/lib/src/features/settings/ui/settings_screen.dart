import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(settingsPreferencesProvider);
    final actions = ref.watch(settingsActionsProvider);

    ref.listen(settingsActionsProvider, (previous, next) {
      if (next.hasError && previous?.isLoading == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Ayarlar')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            const _SectionTitle('Hesap'),
            _SettingsTile(
              icon: Icons.person_outline,
              title: 'Profil',
              subtitle: 'Profilini ve araçlarını görüntüle',
              onTap: () => context.push('/profile'),
            ),
            _SettingsTile(
              icon: Icons.delete_outline,
              title: 'Hesabı sil',
              subtitle: '30 günlük silme sürecini başlat',
              destructive: true,
              onTap: actions.isLoading
                  ? null
                  : () => _showDeleteAccountFlow(context, ref),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionTitle('Mahremiyet'),
            _SettingsSwitchTile(
              icon: Icons.visibility_off_outlined,
              title: 'Hayalet mod kısayolu',
              subtitle: 'Haritadaki görünürlük kontrolünü açık tut',
              value: prefs.ghostModeShortcut,
              onChanged: (value) =>
                  ref.read(settingsPreferencesProvider.notifier).update(
                        prefs.copyWith(ghostModeShortcut: value),
                      ),
            ),
            _SettingsSwitchTile(
              icon: Icons.done_all,
              title: 'Görüldü işareti',
              subtitle: 'DM içinde okundu bilgisini paylaş',
              value: prefs.readReceipts,
              onChanged: (value) =>
                  ref.read(settingsPreferencesProvider.notifier).update(
                        prefs.copyWith(readReceipts: value),
                      ),
            ),
            _SettingsTile(
              icon: Icons.file_download_outlined,
              title: 'Veri dışa aktar',
              subtitle: 'JSON arşiv linki e-posta ile gönderilir',
              loading: actions.isLoading,
              onTap: actions.isLoading
                  ? null
                  : () => _requestDataExport(context, ref),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionTitle('Bildirim'),
            _SettingsSwitchTile(
              icon: Icons.notifications_outlined,
              title: 'Genel bildirimler',
              subtitle: 'Tüm bildirim kategorileri için ana anahtar',
              value: prefs.generalNotifications,
              onChanged: (value) =>
                  ref.read(settingsPreferencesProvider.notifier).update(
                        prefs.copyWith(generalNotifications: value),
                      ),
            ),
            _SettingsTile(
              icon: Icons.tune,
              title: 'Bildirim kategorileri',
              subtitle: 'Yardım, flare, DM ve topluluk tercihleri',
              onTap: () => context.push('/settings/notifications'),
            ),
            _SettingsTile(
              icon: Icons.notifications_active_outlined,
              title: 'Bildirim merkezi',
              subtitle: 'Son bildirimleri ve okundu durumunu gör',
              onTap: () => context.push('/notifications'),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionTitle('Uygulama'),
            _SettingsSwitchTile(
              icon: Icons.speed_outlined,
              title: 'Sürerken kullanma kilidi',
              subtitle: '10 km/s üzerindeyken kayıt akışını kilitle',
              value: prefs.drivingSafetyLock,
              onChanged: (value) =>
                  ref.read(settingsPreferencesProvider.notifier).update(
                        prefs.copyWith(drivingSafetyLock: value),
                      ),
            ),
            _LanguageTile(prefs: prefs),
            const _SettingsTile(
              icon: Icons.dark_mode_outlined,
              title: 'Tema',
              subtitle: 'Pitlane dark tema',
              onTap: null,
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionTitle('Yasal'),
            _SettingsTile(
              icon: Icons.policy_outlined,
              title: 'Gizlilik politikası',
              subtitle: 'KVKK ve veri işleme bilgileri',
              onTap: () => _showInfoSheet(
                context,
                title: 'Gizlilik politikası',
                body:
                    'Pitlane konum verisini H3 hücreleriyle işler; ham GPS paylaşımı yapılmaz. Veri dışa aktarma ve hesap silme haklarına Ayarlar üzerinden erişebilirsin.',
              ),
            ),
            _SettingsTile(
              icon: Icons.gavel_outlined,
              title: 'Kullanım koşulları',
              subtitle: 'Topluluk ve güvenli kullanım kuralları',
              onTap: () => _showInfoSheet(
                context,
                title: 'Kullanım koşulları',
                body:
                    'Pitlane topluluk güvenliği, sürüş sırasında dikkat ve iyi niyetli paylaşım ilkeleriyle çalışır.',
              ),
            ),
            _SettingsTile(
              icon: Icons.code,
              title: 'Açık kaynak lisansları',
              subtitle: 'Kullanılan paketlerin lisansları',
              onTap: () => showLicensePage(
                context: context,
                applicationName: 'Pitlane',
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionTitle('Destek'),
            _SettingsTile(
              icon: Icons.help_outline,
              title: 'SSS',
              subtitle: 'Sık sorulan sorular',
              onTap: () => _showInfoSheet(
                context,
                title: 'SSS',
                body:
                    'Yardım çağrıları haritada H3 hücresi üzerinden görünür. Flare, DM ve topluluk akışlarını ilgili sekmelerden yönetebilirsin.',
              ),
            ),
            _SettingsTile(
              icon: Icons.feedback_outlined,
              title: 'Geri bildirim gönder',
              subtitle: 'Ekibe kısa not bırak',
              onTap: () => _showInfoSheet(
                context,
                title: 'Geri bildirim',
                body:
                    'Geri bildirim kanalı Sprint sonrası destek ekranına bağlanacak.',
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Future<void> _requestDataExport(BuildContext context, WidgetRef ref) async {
    await ref.read(settingsActionsProvider.notifier).requestDataExport();
    if (!context.mounted) return;
    if (!ref.read(settingsActionsProvider).hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veri arşivi talebi alındı. Link e-posta ile gelecek.'),
        ),
      );
    }
  }

  Future<void> _showDeleteAccountFlow(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final firstConfirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hesabı sil'),
        content: const Text(
          'Bu işlem 30 günlük silme sürecini başlatır. Profilin beklemeye alınır ve e-posta ile iptal bağlantısı gönderilir.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Devam et'),
          ),
        ],
      ),
    );
    if (firstConfirm != true || !context.mounted) return;

    final reasonController = TextEditingController();
    final confirmController = TextEditingController();
    final secondConfirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Son onay'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Devam etmek için kutuya SIL yaz.'),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: confirmController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Onay'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: reasonController,
              maxLength: 200,
              decoration: const InputDecoration(
                labelText: 'Neden ayrılıyorsun? (isteğe bağlı)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context)
                .pop(confirmController.text.trim().toUpperCase() == 'SIL'),
            child: const Text('Hesabı sil'),
          ),
        ],
      ),
    );
    if (!context.mounted) return;
    if (secondConfirm != true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silme onayı tamamlanmadı.')),
      );
      return;
    }

    await ref
        .read(settingsActionsProvider.notifier)
        .requestAccountDeletion(reason: reasonController.text.trim());
    reasonController.dispose();
    confirmController.dispose();
    if (!context.mounted) return;
    if (ref.read(settingsActionsProvider).hasError) return;

    await ref.read(authNotifierProvider.notifier).signOut();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Hesap silme süreci başlatıldı.')),
    );
    context.go('/auth/login');
  }

  void _showInfoSheet(
    BuildContext context, {
    required String title,
    required String body,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: AppSpacing.xl),
            PitlaneButton(
              label: 'Tamam',
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        bottom: AppSpacing.sm,
        left: AppSpacing.xs,
      ),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: AppColors.textTertiary,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.destructive = false,
    this.loading = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final bool destructive;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? AppColors.error : AppColors.pitRed;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.surface3),
        ),
        child: ListTile(
          enabled: onTap != null,
          leading:
              Icon(icon, color: onTap == null ? AppColors.textTertiary : color),
          title: Text(title),
          subtitle: Text(subtitle),
          trailing: loading
              ? const SizedBox(
                  width: AppSpacing.xl,
                  height: AppSpacing.xl,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.chevron_right),
          onTap: onTap,
        ),
      ),
    );
  }
}

class _SettingsSwitchTile extends StatelessWidget {
  const _SettingsSwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
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
          secondary: Icon(icon, color: AppColors.pitRed),
          value: value,
          onChanged: onChanged,
          title: Text(title),
          subtitle: Text(subtitle),
        ),
      ),
    );
  }
}

class _LanguageTile extends ConsumerWidget {
  const _LanguageTile({required this.prefs});

  final SettingsPreferences prefs;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.surface3),
        ),
        child: ListTile(
          leading: const Icon(Icons.language, color: AppColors.pitRed),
          title: const Text('Dil'),
          subtitle: Text(prefs.language.label),
          trailing: DropdownButton<SettingsLanguage>(
            value: prefs.language,
            underline: const SizedBox.shrink(),
            dropdownColor: AppColors.surface2,
            items: SettingsLanguage.values
                .map(
                  (language) => DropdownMenuItem(
                    value: language,
                    child: Text(language.label),
                  ),
                )
                .toList(growable: false),
            onChanged: (value) {
              if (value == null) return;
              ref.read(settingsPreferencesProvider.notifier).update(
                    prefs.copyWith(language: value),
                  );
            },
          ),
        ),
      ),
    );
  }
}
