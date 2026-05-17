import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../features/help/models/help_request.dart';
import '../../../features/help/providers/help_request_provider.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../providers/location_provider.dart';

Future<void> showSosSheet(BuildContext context, WidgetRef ref) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.surface2,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.lg)),
    ),
    builder: (_) => _SosSheet(locationRef: ref),
  );
}

class _SosSheet extends ConsumerStatefulWidget {
  const _SosSheet({required this.locationRef});
  final WidgetRef locationRef;

  @override
  ConsumerState<_SosSheet> createState() => _SosSheetState();
}

class _SosSheetState extends ConsumerState<_SosSheet> {
  HelpIssueType _selectedType = HelpIssueType.breakdown;
  final _descController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final h3Cell = widget.locationRef.read(locationProvider).valueOrNull;
    if (h3Cell == null) {
      setState(() => _error = 'Konum alınamadı — GPS\'i açık tut');
      return;
    }

    setState(() => _error = null);

    final request = await ref.read(helpRequestProvider.notifier).create(
          CreateHelpRequestDraft(
            h3Cell: h3Cell,
            issueType: _selectedType,
            description: _descController.text.trim().isEmpty
                ? null
                : _descController.text.trim(),
          ),
        );

    final error = ref.read(helpRequestProvider).error;
    if (!mounted) return;
    if (request == null) {
      setState(() => _error = error?.toString() ?? 'Bir hata oluştu');
      return;
    }

    Navigator.of(context).pop();
    context.push('/help');
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(helpRequestProvider).isLoading;

    return Semantics(
      explicitChildNodes: true,
      label: 'Acil yardım formu',
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.lg,
          AppSpacing.xl,
          AppSpacing.xl + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.surface3,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Acil Yardım',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.error,
                    )),
            const SizedBox(height: AppSpacing.xs),
            Text('Sorun türünü seç, yakındaki Rollpit üyeleri görsün.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: HelpIssueType.values.map((type) {
                final selected = _selectedType == type;
                return Semantics(
                  button: true,
                  selected: selected,
                  label: '${type.label} yardım tipi',
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedType = type),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.error : AppColors.surface3,
                        borderRadius: BorderRadius.circular(AppSpacing.xl),
                      ),
                      child: Text('${type.emoji} ${type.label}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w500)),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
            Semantics(
              textField: true,
              label: 'Yardım açıklaması',
              hint: 'Kısa açıklama isteğe bağlı',
              child: TextField(
                controller: _descController,
                maxLength: 300,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Kısa açıklama (isteğe bağlı)',
                  hintStyle: const TextStyle(color: AppColors.textTertiary),
                  filled: true,
                  fillColor: AppColors.surface3,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.md),
                    borderSide: BorderSide.none,
                  ),
                  counterStyle: const TextStyle(color: AppColors.textTertiary),
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(_error!,
                  style: const TextStyle(color: AppColors.error, fontSize: 13)),
            ],
            const SizedBox(height: AppSpacing.lg),
            RollpitButton(
              label: 'Yardım İste',
              onPressed: isLoading ? null : _send,
              isLoading: isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
