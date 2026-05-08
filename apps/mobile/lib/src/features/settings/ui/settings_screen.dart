import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ayarlar')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _SettingsTile(
              icon: Icons.notifications_outlined,
              title: 'Bildirim ayarları',
              subtitle: 'Kategori bazlı bildirim tercihleri',
              onTap: () => context.push('/settings/notifications'),
            ),
            const SizedBox(height: AppSpacing.md),
            _SettingsTile(
              icon: Icons.notifications_active_outlined,
              title: 'Bildirim merkezi',
              subtitle: 'Son bildirimleri ve okundu durumunu gör',
              onTap: () => context.push('/notifications'),
            ),
          ],
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
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

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
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
