import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../../../shared/widgets/rollpit_text_field.dart';
import '../constants/community_constants.dart';
import '../models/community.dart';
import '../providers/communities_provider.dart';

class CommunityCreateScreen extends ConsumerStatefulWidget {
  const CommunityCreateScreen({super.key});

  @override
  ConsumerState<CommunityCreateScreen> createState() =>
      _CommunityCreateScreenState();
}

class _CommunityCreateScreenState extends ConsumerState<CommunityCreateScreen> {
  final _nameController = TextEditingController();
  final _slugController = TextEditingController();
  final _cityController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _coverUrlController = TextEditingController();

  CommunityType _type = CommunityType.public;
  CommunityVehicleType _vehicleType = CommunityVehicleType.all;
  bool _slugEdited = false;

  String? _nameError;
  String? _slugError;
  String? _coverUrlError;

  @override
  void dispose() {
    _nameController.dispose();
    _slugController.dispose();
    _cityController.dispose();
    _descriptionController.dispose();
    _coverUrlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    final draft = CreateCommunityDraft(
      name: _nameController.text.trim(),
      slug: _slugController.text.trim(),
      type: _type,
      vehicleType: _vehicleType,
      city: _cityController.text.trim().isEmpty
          ? null
          : _cityController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      coverUrl: _coverUrlController.text.trim().isEmpty
          ? null
          : _coverUrlController.text.trim(),
    );

    final created =
        await ref.read(communitiesProvider.notifier).createCommunity(draft);
    if (!mounted) return;
    context.go('/communities/${created.slug}');
  }

  bool _validate() {
    final name = _nameController.text.trim();
    final slug = _slugController.text.trim();
    final coverUrl = _coverUrlController.text.trim();
    final slugRegex = RegExp(r'^[a-z0-9-]+$');

    setState(() {
      _nameError = name.length < CommunityConstants.nameMinLength ||
              name.length > CommunityConstants.nameMaxLength
          ? '3-60 karakter olmalı'
          : null;
      _slugError = slug.length < CommunityConstants.slugMinLength ||
              slug.length > CommunityConstants.slugMaxLength ||
              !slugRegex.hasMatch(slug)
          ? '3-40 karakter; küçük harf, rakam ve tire'
          : null;

      final uri = Uri.tryParse(coverUrl);
      _coverUrlError = coverUrl.isNotEmpty &&
              (uri?.hasScheme != true || uri?.host.isEmpty == true)
          ? 'Geçerli bir kapak bağlantısı gir veya boş bırak'
          : null;
    });

    return _nameError == null && _slugError == null && _coverUrlError == null;
  }

  void _syncSlug(String name) {
    if (_slugEdited) return;
    _slugController.text = _slugify(name);
  }

  String _slugify(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]'), '')
        .replaceAll('ğ', 'g')
        .replaceAll('ü', 'u')
        .replaceAll('ş', 's')
        .replaceAll('ö', 'o')
        .replaceAll('ç', 'c')
        .replaceAll('ı', 'i')
        .replaceAll('İ', 'i')
        .replaceAll(RegExp(r'[\s-]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(communitiesProvider).isLoading;

    ref.listen(communitiesProvider, (previous, next) {
      final error = next.error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Topluluk oluştur')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          children: [
            Text(
              'Yeni garaj alanı',
              style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Topluluğun adı, tipi ve araç odağı keşifte görünür.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xl2),
            RollpitTextField(
              label: 'Ad',
              hint: 'Istanbul Riders',
              controller: _nameController,
              maxLength: CommunityConstants.nameMaxLength,
              textInputAction: TextInputAction.next,
              errorText: _nameError,
              autofocus: true,
              onChanged: _syncSlug,
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitTextField(
              label: 'Slug',
              hint: 'istanbul-riders',
              controller: _slugController,
              maxLength: CommunityConstants.slugMaxLength,
              textInputAction: TextInputAction.next,
              errorText: _slugError,
              onChanged: (_) => _slugEdited = true,
            ),
            const SizedBox(height: AppSpacing.lg),
            DropdownButtonFormField<CommunityType>(
              initialValue: _type,
              decoration: const InputDecoration(labelText: 'Topluluk tipi'),
              items: CommunityType.values
                  .map(
                    (type) =>
                        DropdownMenuItem(value: type, child: Text(type.label)),
                  )
                  .toList(),
              onChanged: isLoading
                  ? null
                  : (value) => setState(() => _type = value ?? _type),
            ),
            const SizedBox(height: AppSpacing.lg),
            DropdownButtonFormField<CommunityVehicleType>(
              initialValue: _vehicleType,
              decoration: const InputDecoration(labelText: 'Araç tipi'),
              items: CommunityVehicleType.values
                  .map(
                    (type) =>
                        DropdownMenuItem(value: type, child: Text(type.label)),
                  )
                  .toList(),
              onChanged: isLoading
                  ? null
                  : (value) =>
                      setState(() => _vehicleType = value ?? _vehicleType),
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitTextField(
              label: 'Şehir',
              hint: 'İstanbul',
              controller: _cityController,
              maxLength: CommunityConstants.cityMaxLength,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitTextField(
              label: 'Açıklama',
              hint: 'Buluşmalar, rotalar ve garaj sohbetleri',
              controller: _descriptionController,
              maxLength: CommunityConstants.descriptionMaxLength,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitTextField(
              label: 'Kapak bağlantısı',
              hint: 'İstersen boş bırak',
              controller: _coverUrlController,
              keyboardType: TextInputType.url,
              textInputAction: TextInputAction.done,
              errorText: _coverUrlError,
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: AppSpacing.xl),
            RollpitButton(
              label: 'Oluştur',
              onPressed: isLoading ? null : _submit,
              isLoading: isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
