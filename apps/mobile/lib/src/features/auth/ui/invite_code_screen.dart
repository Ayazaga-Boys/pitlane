import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../../../shared/widgets/pitlane_text_field.dart';
import '../providers/invite_code_provider.dart';

class InviteCodeScreen extends ConsumerStatefulWidget {
  const InviteCodeScreen({super.key});

  @override
  ConsumerState<InviteCodeScreen> createState() => _InviteCodeScreenState();
}

class _InviteCodeScreenState extends ConsumerState<InviteCodeScreen> {
  final _codeController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _validate() async {
    final code = _codeController.text.trim();
    if (code.isEmpty) {
      setState(() => _error = 'Davet kodunu gir');
      return;
    }
    setState(() => _error = null);

    final valid = await ref.read(inviteCodeProvider.notifier).validate(code);

    if (!mounted) return;

    final asyncState = ref.read(inviteCodeProvider);
    if (asyncState.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(asyncState.error.toString()),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (valid) {
      context.push('/auth/login');
    } else {
      context.push('/auth/waiting-list');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(inviteCodeProvider).isLoading;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl3),

              // Logo + slogan
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

              // Davet kodu input
              PitlaneTextField(
                label: 'Davet Kodu',
                hint: 'Örn: PITLANE',
                controller: _codeController,
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _validate(),
                errorText: _error,
                autofocus: true,
                maxLength: 20,
              ),
              const SizedBox(height: AppSpacing.lg),

              PitlaneButton(
                label: 'Devam et',
                onPressed: isLoading ? null : _validate,
                isLoading: isLoading,
              ),

              const SizedBox(height: AppSpacing.xl),
              const Divider(),
              const SizedBox(height: AppSpacing.xl),

              // Waiting list CTA
              Center(
                child: Column(
                  children: [
                    Text(
                      'Davet kodun yok mu?',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.push('/auth/waiting-list'),
                      child: const Text('Bekleme listesine katıl'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
