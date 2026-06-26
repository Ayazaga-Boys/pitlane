import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../../../shared/widgets/rollpit_text_field.dart';
import '../providers/invite_code_provider.dart';

class WaitingListScreen extends ConsumerStatefulWidget {
  const WaitingListScreen({super.key});

  @override
  ConsumerState<WaitingListScreen> createState() => _WaitingListScreenState();
}

class _WaitingListScreenState extends ConsumerState<WaitingListScreen> {
  final _emailController = TextEditingController();
  String _selectedVehicle = 'car';
  String _selectedCity = 'Istanbul';
  bool _submitted = false;

  static const _vehicles = [
    ('car', 'Otomobil 🚗'),
    ('motorcycle', 'Motosiklet 🏍️'),
    ('other', 'Diğer'),
  ];

  static const _cities = [
    'Istanbul',
    'Ankara',
    'Izmir',
    'Bursa',
    'Antalya',
    'Adana',
    'Eskisehir',
    'Diger',
  ];

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  String? _validateEmail(String email) {
    if (email.isEmpty) {
      return 'E-posta gir';
    }
    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(email)) {
      return 'Geçerli e-posta gir';
    }
    return null;
  }

  Future<void> _submit() async {
    final emailError = _validateEmail(_emailController.text);
    if (emailError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(emailError), backgroundColor: AppColors.error),
      );
      return;
    }

    await ref.read(waitingListProvider.notifier).join(
          email: _emailController.text.trim(),
          vehicleType: _selectedVehicle,
          city: _selectedCity,
        );

    if (!mounted) return;
    final state = ref.read(waitingListProvider);

    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error.toString()),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _submitted = true);
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(waitingListProvider).isLoading;

    if (_submitted) {
      return _SuccessView(onBack: () => context.go('/auth/invite-code'));
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Bekleme Listesi'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Rollpit yakında kapılarını açıyor.',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Listeye katıl, davet kodu gelince ilk sen haber al.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: AppSpacing.xl2),

              RollpitTextField(
                label: 'E-posta',
                hint: 'ornek@email.com',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofocus: true,
              ),
              const SizedBox(height: AppSpacing.lg),

              // Araç tipi
              Text(
                'Araç Tipin',
                style: Theme.of(context).textTheme.labelMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              SegmentedButton<String>(
                segments: _vehicles
                    .map((v) => ButtonSegment(value: v.$1, label: Text(v.$2)))
                    .toList(),
                selected: {_selectedVehicle},
                onSelectionChanged: (s) =>
                    setState(() => _selectedVehicle = s.first),
                style: ButtonStyle(
                  backgroundColor: WidgetStateProperty.resolveWith(
                    (states) => states.contains(WidgetState.selected)
                        ? AppColors.pitRed
                        : AppColors.surface2,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // Şehir
              Text('Şehrin', style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: AppSpacing.sm),
              DropdownButtonFormField<String>(
                initialValue: _selectedCity,
                decoration: const InputDecoration(),
                dropdownColor: AppColors.surface2,
                items: _cities
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _selectedCity = v!),
              ),
              const SizedBox(height: AppSpacing.xl2),

              RollpitButton(
                label: 'Listeye Katıl',
                onPressed: isLoading ? null : _submit,
                isLoading: isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.check_circle_outline,
                size: 72,
                color: AppColors.success,
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Listeye katıldın!',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Davet kodu hazır olunca e-postayla bildireceğiz.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: AppSpacing.xl2),
              RollpitButton(
                label: 'Davet kodum var',
                variant: RollpitButtonVariant.ghost,
                onPressed: onBack,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
