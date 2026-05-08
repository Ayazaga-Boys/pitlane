import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';

// ─── Model ──────────────────────────────────────────────────────────────────

enum VehicleFilter { all, car, motorcycle }
enum PinFilter { all, flare, business, help }

class MapFilters {
  const MapFilters({
    this.vehicle = VehicleFilter.all,
    this.pin = PinFilter.all,
  });

  final VehicleFilter vehicle;
  final PinFilter pin;

  MapFilters copyWith({VehicleFilter? vehicle, PinFilter? pin}) {
    return MapFilters(
      vehicle: vehicle ?? this.vehicle,
      pin: pin ?? this.pin,
    );
  }

  bool get isDefault => vehicle == VehicleFilter.all && pin == PinFilter.all;

  @override
  bool operator ==(Object other) =>
      other is MapFilters && other.vehicle == vehicle && other.pin == pin;

  @override
  int get hashCode => Object.hash(vehicle, pin);
}

// ─── Provider ───────────────────────────────────────────────────────────────

final mapFiltersProvider = NotifierProvider<MapFiltersNotifier, MapFilters>(
  MapFiltersNotifier.new,
);

class MapFiltersNotifier extends Notifier<MapFilters> {
  @override
  MapFilters build() => const MapFilters();

  void setVehicle(VehicleFilter v) => state = state.copyWith(vehicle: v);
  void setPin(PinFilter p) => state = state.copyWith(pin: p);
  void reset() => state = const MapFilters();
}

// ─── Bottom Sheet ────────────────────────────────────────────────────────────

void showMapFilterSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.surface2,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.lg)),
    ),
    builder: (_) => const _MapFilterSheet(),
  );
}

class _MapFilterSheet extends ConsumerWidget {
  const _MapFilterSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filters = ref.watch(mapFiltersProvider);
    final notifier = ref.read(mapFiltersProvider.notifier);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
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
            Row(
              children: [
                Text('Filtrele', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const Spacer(),
                if (!filters.isDefault)
                  TextButton(
                    onPressed: notifier.reset,
                    child: const Text('Temizle'),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // Araç tipi
            Text('Araç Tipi', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: AppSpacing.sm),
            SegmentedButton<VehicleFilter>(
              segments: const [
                ButtonSegment(value: VehicleFilter.all,        label: Text('Hepsi')),
                ButtonSegment(value: VehicleFilter.car,        label: Text('Araç 🚗')),
                ButtonSegment(value: VehicleFilter.motorcycle, label: Text('Moto 🏍️')),
              ],
              selected: {filters.vehicle},
              onSelectionChanged: (s) => notifier.setVehicle(s.first),
              style: ButtonStyle(
                backgroundColor: WidgetStateProperty.resolveWith(
                  (s) => s.contains(WidgetState.selected) ? AppColors.pitRed : AppColors.surface3,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Pin tipi
            Text('Göster', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              children: [
                _PinChip(label: 'Hepsi',     value: PinFilter.all,      current: filters.pin, onTap: notifier.setPin),
                _PinChip(label: 'Etkinlik',  value: PinFilter.flare,    current: filters.pin, onTap: notifier.setPin, icon: Icons.local_fire_department_outlined),
                _PinChip(label: 'İşletme',   value: PinFilter.business, current: filters.pin, onTap: notifier.setPin, icon: Icons.store_outlined),
                _PinChip(label: 'Yardım',    value: PinFilter.help,     current: filters.pin, onTap: notifier.setPin, icon: Icons.sos_outlined),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),

            PitlaneButton(
              label: 'Uygula',
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}

class _PinChip extends StatelessWidget {
  const _PinChip({
    required this.label,
    required this.value,
    required this.current,
    required this.onTap,
    this.icon,
  });

  final String label;
  final PinFilter value;
  final PinFilter current;
  final ValueChanged<PinFilter> onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final selected = current == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: selected ? AppColors.pitRed : AppColors.surface3,
          borderRadius: BorderRadius.circular(AppSpacing.xl),
          border: Border.all(color: selected ? AppColors.pitRed : AppColors.surface3),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 14, color: Colors.white), const SizedBox(width: 4)],
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
