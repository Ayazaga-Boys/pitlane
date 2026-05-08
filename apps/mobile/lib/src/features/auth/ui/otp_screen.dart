import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.email});
  final String email;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final token = _otpController.text.trim();
    if (token.length != 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('8 haneli kodu gir')),
      );
      return;
    }

    await ref
        .read(authNotifierProvider.notifier)
        .verifyOtp(widget.email, token);

    final authState = ref.read(authNotifierProvider);
    if (!mounted) return;

    authState.when(
      data: (_) => context.go('/profile/complete'),
      error: (e, _) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
      ),
      loading: () {},
    );
  }

  Future<void> _resend() async {
    await ref.read(authNotifierProvider.notifier).sendOtp(widget.email);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Kod tekrar gönderildi')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authNotifierProvider).isLoading;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Kodu gir',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                '${widget.email} adresine 8 haneli kod gönderdik.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: AppSpacing.xl2),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 8,
                autofocus: true,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      letterSpacing: 16,
                      fontWeight: FontWeight.w600,
                    ),
                decoration: const InputDecoration(counterText: ''),
                onSubmitted: (_) => _verify(),
              ),
              const SizedBox(height: AppSpacing.lg),
              PitlaneButton(
                label: 'Doğrula',
                onPressed: isLoading ? null : _verify,
                isLoading: isLoading,
              ),
              const SizedBox(height: AppSpacing.md),
              Center(
                child: TextButton(
                  onPressed: isLoading ? null : _resend,
                  child: const Text('Tekrar gönder'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
