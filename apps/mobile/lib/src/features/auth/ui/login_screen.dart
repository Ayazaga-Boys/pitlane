import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../../../shared/widgets/pitlane_text_field.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  String? _emailError;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  bool _validateEmail(String email) {
    final valid = RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(email.trim());
    setState(() => _emailError = valid ? null : 'Geçerli bir e-posta gir');
    return valid;
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text;
    if (!_validateEmail(email)) return;

    await ref.read(authNotifierProvider.notifier).sendOtp(email);

    final authState = ref.read(authNotifierProvider);
    if (!mounted) return;

    authState.when(
      data: (_) => context.push('/auth/otp', extra: email.trim()),
      error: (e, _) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      ),
      loading: () {},
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authNotifierProvider).isLoading;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl3),
              Text(
                'Pitlane',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: AppColors.pitRed,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                    ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Asfaltta yalnız değilsin.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: AppSpacing.xl3),
              PitlaneTextField(
                label: 'E-posta',
                hint: 'ornek@email.com',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _sendOtp(),
                errorText: _emailError,
                autofocus: true,
              ),
              const SizedBox(height: AppSpacing.lg),
              PitlaneButton(
                label: 'Devam et',
                onPressed: isLoading ? null : _sendOtp,
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.lg),
              Center(
                child: Text(
                  'Devam ederek Topluluk Kurallarını kabul etmiş olursun.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
