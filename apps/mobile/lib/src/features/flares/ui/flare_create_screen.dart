import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../../../shared/widgets/rollpit_text_field.dart';
import '../../map/providers/location_provider.dart';
import '../constants/flare_constants.dart';
import '../models/flare.dart';
import '../providers/flare_create_provider.dart';

class FlareCreateScreen extends ConsumerStatefulWidget {
  const FlareCreateScreen({
    super.key,
    this.initialH3Cell,
    this.communityId,
  });

  final String? initialH3Cell;
  final String? communityId;

  @override
  ConsumerState<FlareCreateScreen> createState() => _FlareCreateScreenState();
}

class _FlareCreateScreenState extends ConsumerState<FlareCreateScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _h3CellController = TextEditingController();
  final _coverUrlController = TextEditingController();

  DateTime? _startsAt;
  DateTime? _endsAt;
  String? _titleError;
  String? _h3CellError;
  String? _timeError;
  String? _coverUrlError;

  @override
  void initState() {
    super.initState();
    _h3CellController.text = widget.initialH3Cell ?? '';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _h3CellController.dispose();
    _coverUrlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    final draft = CreateFlareDraft(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      h3Cell: _h3CellController.text.trim(),
      startsAt: _startsAt!,
      endsAt: _endsAt,
      communityId: widget.communityId,
      coverUrl: _coverUrlController.text.trim().isEmpty
          ? null
          : _coverUrlController.text.trim(),
    );

    final created = await ref.read(flareCreateProvider.notifier).create(draft);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${created.title} yayına hazır.')),
    );
    context.pop();
  }

  bool _validate() {
    final title = _titleController.text.trim();
    final h3Cell = _h3CellController.text.trim();
    final coverUrl = _coverUrlController.text.trim();
    final minStart = DateTime.now().add(
      const Duration(minutes: FlareConstants.minStartOffsetMinutes),
    );
    final h3Regex = RegExp(r'^[0-9a-fA-F]{15}$');

    setState(() {
      _titleError = title.length < FlareConstants.titleMinLength ||
              title.length > FlareConstants.titleMaxLength
          ? '3-80 karakter olmalı'
          : null;
      _h3CellError =
          !h3Regex.hasMatch(h3Cell) ? '15 karakterlik H3 hücresi gir' : null;
      _timeError = _startsAt == null || _startsAt!.isBefore(minStart)
          ? 'Başlangıç en az 5 dk sonra olmalı'
          : null;
      if (_startsAt != null &&
          _endsAt != null &&
          !_endsAt!.isAfter(_startsAt!)) {
        _timeError = 'Bitiş, başlangıçtan sonra olmalı';
      }

      final uri = Uri.tryParse(coverUrl);
      _coverUrlError = coverUrl.isNotEmpty &&
              (uri?.hasScheme != true || uri?.host.isEmpty == true)
          ? 'Geçerli bir kapak bağlantısı gir veya boş bırak'
          : null;
    });

    return _titleError == null &&
        _h3CellError == null &&
        _timeError == null &&
        _coverUrlError == null;
  }

  Future<void> _pickStartsAt() async {
    final picked = await _pickDateTime(_startsAt ?? DateTime.now());
    if (picked == null) return;
    setState(() => _startsAt = picked);
  }

  Future<void> _pickEndsAt() async {
    final fallback = _startsAt?.add(const Duration(hours: 2)) ?? DateTime.now();
    final picked = await _pickDateTime(_endsAt ?? fallback);
    if (picked == null) return;
    setState(() => _endsAt = picked);
  }

  Future<DateTime?> _pickDateTime(DateTime initial) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return null;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return null;

    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  void _useCurrentH3Cell() {
    final currentCell = ref.read(locationProvider).valueOrNull;
    if (currentCell == null || currentCell.isEmpty) return;
    _h3CellController.text = currentCell;
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(flareCreateProvider).isLoading;
    final currentCell = ref.watch(locationProvider).valueOrNull;

    ref.listen(flareCreateProvider, (previous, next) {
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
      appBar: AppBar(title: const Text('Flare oluştur')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          children: [
            Text(
              'Buluşmayı yak',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Konum ham GPS olarak değil H3 hücresiyle gönderilir.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: AppSpacing.xl2),
            RollpitTextField(
              label: 'Başlık',
              hint: 'Sahil cruise',
              controller: _titleController,
              maxLength: FlareConstants.titleMaxLength,
              textInputAction: TextInputAction.next,
              errorText: _titleError,
              autofocus: true,
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitTextField(
              label: 'Açıklama',
              hint: 'Kısa rota ve buluşma notu',
              controller: _descriptionController,
              maxLength: FlareConstants.descriptionMaxLength,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitTextField(
              label: 'H3 hücresi',
              hint: '89283082803ffff',
              controller: _h3CellController,
              maxLength: FlareConstants.h3CellLength,
              textInputAction: TextInputAction.next,
              errorText: _h3CellError,
            ),
            const SizedBox(height: AppSpacing.sm),
            if (currentCell != null && currentCell.isNotEmpty)
              TextButton.icon(
                onPressed: _useCurrentH3Cell,
                icon: const Icon(Icons.my_location),
                label: const Text('Mevcut H3 hücremi kullan'),
              )
            else
              Text(
                'Haritadan konum seçimi bağlandığında bu alan otomatik dolar.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
              ),
            const SizedBox(height: AppSpacing.lg),
            _DateTimePickerTile(
              label: 'Başlangıç',
              value: _startsAt,
              errorText: _timeError,
              onTap: _pickStartsAt,
            ),
            const SizedBox(height: AppSpacing.md),
            _DateTimePickerTile(
              label: 'Bitiş',
              value: _endsAt,
              onTap: _pickEndsAt,
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
              label: 'Yayınla',
              onPressed: isLoading ? null : _submit,
              isLoading: isLoading,
            ),
          ],
        ),
      ),
    );
  }
}

class _DateTimePickerTile extends StatelessWidget {
  const _DateTimePickerTile({
    required this.label,
    required this.value,
    required this.onTap,
    this.errorText,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onTap;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final formatted =
        value == null ? 'Seç' : DateFormat('d MMM yyyy HH:mm').format(value!);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: AppSpacing.sm),
        Material(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            onTap: onTap,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(
                  color:
                      errorText == null ? AppColors.surface3 : AppColors.error,
                ),
              ),
              child: Row(
                children: [
                  Expanded(child: Text(formatted)),
                  const Icon(Icons.calendar_today_outlined,
                      size: AppSpacing.lg),
                ],
              ),
            ),
          ),
        ),
        if (errorText != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            errorText!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.error,
                ),
          ),
        ],
      ],
    );
  }
}
