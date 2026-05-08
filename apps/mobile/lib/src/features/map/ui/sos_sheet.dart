import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../providers/location_provider.dart';

const _issueTypes = [
  ('breakdown', '🔧', 'Arıza'),
  ('flat_tire', '🛞', 'Lastik Patladı'),
  ('fuel', '⛽', 'Yakıt Bitti'),
  ('accident', '⚠️', 'Kaza'),
  ('other', '🆘', 'Diğer'),
];

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
  String _selectedType = 'breakdown';
  final _descController = TextEditingController();
  bool _loading = false;
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

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final dio = Dio(BaseOptions(
        baseUrl: '${AppConstants.apiBaseUrl}/v1',
        headers: {
          'Content-Type': 'application/json',
          if (AppConstants.isDev)
            'x-dev-user-id': 'c87820f3-a0af-4fe0-b848-6593ef413846',
        },
      ));

      await dio.post<void>('/help-requests', data: {
        'h3_cell': h3Cell,
        'issue_type': _selectedType,
        if (_descController.text.trim().isNotEmpty)
          'description': _descController.text.trim(),
      });

      if (mounted) Navigator.of(context).pop();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content:
                Text('Yardım isteği gönderildi — yakındaki sürücüler görüyor'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } on DioException catch (e) {
      final msg =
          (e.response?.data as Map?)?['error'] as String? ?? 'Bir hata oluştu';
      setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
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
          Text('Sorun türünü seç, yakındaki Pitlane üyeleri görsün.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: AppSpacing.lg),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: _issueTypes.map((t) {
              final selected = _selectedType == t.$1;
              return GestureDetector(
                onTap: () => setState(() => _selectedType = t.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.error : AppColors.surface3,
                    borderRadius: BorderRadius.circular(AppSpacing.xl),
                  ),
                  child: Text('${t.$2} ${t.$3}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w500)),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
          TextField(
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
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(_error!,
                style: const TextStyle(color: AppColors.error, fontSize: 13)),
          ],
          const SizedBox(height: AppSpacing.lg),
          PitlaneButton(
            label: 'Yardım İste',
            onPressed: _loading ? null : _send,
            isLoading: _loading,
          ),
        ],
      ),
    );
  }
}
