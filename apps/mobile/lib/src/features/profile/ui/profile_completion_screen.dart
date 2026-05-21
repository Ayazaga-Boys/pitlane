import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../../../shared/widgets/rollpit_text_field.dart';
import '../constants/profile_constants.dart';
import '../models/vehicle.dart';
import '../providers/profile_completion_provider.dart';

class ProfileCompletionScreen extends ConsumerWidget {
  const ProfileCompletionScreen({super.key});

  void _leaveCompletion(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.go('/profile');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final completion = ref.watch(profileCompletionProvider);

    ref.listen(profileCompletionProvider, (previous, next) {
      final error = next.error;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
      if (next.valueOrNull?.step == ProfileCompletionStep.done) {
        context.go('/map');
      }
    });

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Geri',
          icon: const Icon(Icons.arrow_back),
          onPressed: () => _leaveCompletion(context),
        ),
        title: const Text('Profilini tamamla'),
      ),
      body: SafeArea(
        child: PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) _leaveCompletion(context);
          },
          child: completion.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => _OnboardingFrame(
              progress: ProfileConstants.progressNotStarted,
              child: _ErrorState(message: error.toString()),
            ),
            data: (state) => _OnboardingFrame(
              progress: state.progress,
              child: switch (state.step) {
                ProfileCompletionStep.identity => _IdentityStep(state: state),
                ProfileCompletionStep.vehicle => const _VehicleStep(),
                ProfileCompletionStep.permissions => const _PermissionsStep(),
                ProfileCompletionStep.rules => const _RulesStep(),
                ProfileCompletionStep.done =>
                  const Center(child: CircularProgressIndicator()),
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingFrame extends StatelessWidget {
  const _OnboardingFrame({
    required this.progress,
    required this.child,
  });

  final double progress;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: AppSpacing.xs,
              backgroundColor: AppColors.surface3,
              color: AppColors.pitRed,
            ),
          ),
          const SizedBox(height: AppSpacing.xl2),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _IdentityStep extends ConsumerStatefulWidget {
  const _IdentityStep({required this.state});

  final ProfileCompletionState state;

  @override
  ConsumerState<_IdentityStep> createState() => _IdentityStepState();
}

class _IdentityStepState extends ConsumerState<_IdentityStep> {
  late final TextEditingController _usernameController;
  late final TextEditingController _displayNameController;
  late final TextEditingController _avatarUrlController;
  String? _usernameError;
  String? _displayNameError;
  String? _avatarUrlError;

  @override
  void initState() {
    super.initState();
    final profile = widget.state.profile;
    _usernameController = TextEditingController(text: profile?.username);
    _displayNameController = TextEditingController(text: profile?.displayName);
    _avatarUrlController = TextEditingController(text: profile?.avatarUrl);
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _displayNameController.dispose();
    _avatarUrlController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_validate()) return;

    await ref.read(profileCompletionProvider.notifier).saveIdentity(
          username: _usernameController.text.trim(),
          displayName: _displayNameController.text.trim(),
          avatarUrl: _avatarUrlController.text.trim().isEmpty
              ? null
              : _avatarUrlController.text.trim(),
        );
  }

  bool _validate() {
    final username = _usernameController.text.trim();
    final displayName = _displayNameController.text.trim();
    final avatarUrl = _avatarUrlController.text.trim();
    final usernameRegex = RegExp(r'^[A-Za-z0-9_]+$');

    setState(() {
      _usernameError = username.length < ProfileConstants.usernameMinLength ||
              username.length > ProfileConstants.usernameMaxLength ||
              !usernameRegex.hasMatch(username)
          ? '3-20 karakter; harf, rakam ve _ kullan'
          : null;
      _displayNameError =
          displayName.length < ProfileConstants.displayNameMinLength ||
                  displayName.length > ProfileConstants.displayNameMaxLength
              ? '2-50 karakter olmalı'
              : null;
      final avatarUri = Uri.tryParse(avatarUrl);
      _avatarUrlError = avatarUrl.isNotEmpty &&
              (avatarUri?.hasScheme != true || avatarUri?.host.isEmpty == true)
          ? 'Geçerli bir avatar bağlantısı gir veya boş bırak'
          : null;
    });

    return _usernameError == null &&
        _displayNameError == null &&
        _avatarUrlError == null;
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(profileCompletionProvider).isLoading;

    return ListView(
      children: [
        Text(
          'Garaj kartını hazırlayalım',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Kullanıcı adın profilde ve topluluklarda görünür.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: AppSpacing.xl2),
        RollpitTextField(
          label: 'Kullanıcı adı',
          hint: 'mert_cb650r',
          controller: _usernameController,
          textInputAction: TextInputAction.next,
          maxLength: ProfileConstants.usernameMaxLength,
          errorText: _usernameError,
          autofocus: true,
        ),
        const SizedBox(height: AppSpacing.lg),
        RollpitTextField(
          label: 'Görünür ad',
          hint: 'Mert Yılmaz',
          controller: _displayNameController,
          textInputAction: TextInputAction.next,
          maxLength: ProfileConstants.displayNameMaxLength,
          errorText: _displayNameError,
        ),
        const SizedBox(height: AppSpacing.lg),
        RollpitTextField(
          label: 'Avatar bağlantısı',
          hint: 'İstersen boş bırak',
          controller: _avatarUrlController,
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          errorText: _avatarUrlError,
          onSubmitted: (_) => _save(),
        ),
        const SizedBox(height: AppSpacing.xl),
        RollpitButton(
          label: 'Devam et',
          onPressed: isLoading ? null : _save,
          isLoading: isLoading,
        ),
      ],
    );
  }
}

class _VehicleStep extends ConsumerStatefulWidget {
  const _VehicleStep();

  @override
  ConsumerState<_VehicleStep> createState() => _VehicleStepState();
}

class _VehicleStepState extends ConsumerState<_VehicleStep> {
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _colorController = TextEditingController();
  VehicleType _type = VehicleType.car;
  String? _makeError;
  String? _modelError;
  String? _yearError;

  @override
  void dispose() {
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _colorController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_validate()) return;
    await ref.read(profileCompletionProvider.notifier).addVehicle(
          type: _type,
          make: _makeController.text.trim(),
          model: _modelController.text.trim(),
          year: _yearController.text.trim().isEmpty
              ? null
              : int.parse(_yearController.text.trim()),
          color: _colorController.text.trim().isEmpty
              ? null
              : _colorController.text.trim(),
        );
  }

  bool _validate() {
    final make = _makeController.text.trim();
    final model = _modelController.text.trim();
    final yearText = _yearController.text.trim();
    final year = int.tryParse(yearText);

    setState(() {
      _makeError =
          make.isEmpty || make.length > ProfileConstants.vehicleNameMaxLength
              ? 'Markayı gir'
              : null;
      _modelError =
          model.isEmpty || model.length > ProfileConstants.vehicleNameMaxLength
              ? 'Modeli gir'
              : null;
      _yearError = yearText.isNotEmpty &&
              (year == null ||
                  year < ProfileConstants.vehicleMinYear ||
                  year > ProfileConstants.vehicleMaxYear)
          ? 'Geçerli bir yıl gir'
          : null;
    });

    return _makeError == null && _modelError == null && _yearError == null;
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(profileCompletionProvider).isLoading;

    return ListView(
      children: [
        Text(
          'İlk aracını ekle',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Rollpit deneyimi araç profiliyle başlar. Sonra garajına yenilerini ekleyebilirsin.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: AppSpacing.xl2),
        DropdownButtonFormField<VehicleType>(
          initialValue: _type,
          decoration: const InputDecoration(labelText: 'Araç tipi'),
          items: VehicleType.values
              .map(
                (type) => DropdownMenuItem(
                  value: type,
                  child: Text(type.label),
                ),
              )
              .toList(),
          onChanged: isLoading
              ? null
              : (value) => setState(() => _type = value ?? _type),
        ),
        const SizedBox(height: AppSpacing.lg),
        RollpitTextField(
          label: 'Marka',
          hint: 'Honda',
          controller: _makeController,
          textInputAction: TextInputAction.next,
          maxLength: ProfileConstants.vehicleNameMaxLength,
          errorText: _makeError,
        ),
        const SizedBox(height: AppSpacing.lg),
        RollpitTextField(
          label: 'Model',
          hint: 'CB650R',
          controller: _modelController,
          textInputAction: TextInputAction.next,
          maxLength: ProfileConstants.vehicleNameMaxLength,
          errorText: _modelError,
        ),
        const SizedBox(height: AppSpacing.lg),
        RollpitTextField(
          label: 'Yıl',
          hint: '2024',
          controller: _yearController,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
          errorText: _yearError,
        ),
        const SizedBox(height: AppSpacing.lg),
        RollpitTextField(
          label: 'Renk',
          hint: 'Kırmızı',
          controller: _colorController,
          textInputAction: TextInputAction.done,
          maxLength: ProfileConstants.vehicleColorMaxLength,
          onSubmitted: (_) => _save(),
        ),
        const SizedBox(height: AppSpacing.xl),
        RollpitButton(
          label: 'Aracı ekle',
          onPressed: isLoading ? null : _save,
          isLoading: isLoading,
        ),
      ],
    );
  }
}

class _PermissionsStep extends ConsumerWidget {
  const _PermissionsStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sinyalleri açalım',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Konumun ham olarak saklanmaz; cihazında H3 hücresine çevrilir.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: AppSpacing.xl2),
        const _InfoTile(
          icon: Icons.location_on_outlined,
          title: 'Konum',
          body: 'Harita yoğunluğu, flare ve yardım çağrıları için kullanılır.',
        ),
        const SizedBox(height: AppSpacing.md),
        const _InfoTile(
          icon: Icons.notifications_active_outlined,
          title: 'Bildirim',
          body: 'Yakındaki yardım çağrısı ve mesajları kaçırmamanı sağlar.',
        ),
        const Spacer(),
        RollpitButton(
          label: 'İzinlere devam et',
          onPressed: () => ref
              .read(profileCompletionProvider.notifier)
              .continueFromPermissions(),
        ),
      ],
    );
  }
}

class _RulesStep extends ConsumerWidget {
  const _RulesStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Topluluk çizgisi',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Saygılı, güvenli ve yolda kalanı yalnız bırakmayan bir topluluk istiyoruz.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: AppSpacing.xl2),
        const _RuleTile(text: 'Tehlikeli sürüşü teşvik eden içerik paylaşma.'),
        const _RuleTile(text: 'Yardım çağrılarını gerçek ihtiyaç için kullan.'),
        const _RuleTile(
            text: 'Taciz, spam ve sahte profil Rollpit’de yer bulmaz.'),
        const Spacer(),
        RollpitButton(
          label: 'Kabul et ve başla',
          onPressed: () =>
              ref.read(profileCompletionProvider.notifier).acceptRules(),
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.pitRed, size: AppSpacing.xl),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    body,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RuleTile extends StatelessWidget {
  const _RuleTile({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle,
              color: AppColors.success, size: AppSpacing.xl),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends ConsumerWidget {
  const _ErrorState({required this.message});

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
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppColors.error),
          ),
          const SizedBox(height: AppSpacing.lg),
          RollpitButton(
            label: 'Tekrar dene',
            onPressed: () => ref.invalidate(profileCompletionProvider),
          ),
        ],
      ),
    );
  }
}
