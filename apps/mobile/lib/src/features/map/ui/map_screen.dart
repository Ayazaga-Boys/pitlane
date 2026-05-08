import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/location_utils.dart';
import '../providers/ghost_mode_provider.dart';
import '../providers/location_provider.dart';
import '../providers/map_pins_provider.dart';
import 'location_permission_screen.dart';
import 'map_filter_sheet.dart';
// PinFilter import için
import 'sos_pulse_widget.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen>
    with WidgetsBindingObserver {
  GoogleMapController? _mapController;
  bool _showPermissionRationale = false;

  static const _istanbul = CameraPosition(
    target: LatLng(41.0082, 28.9784),
    zoom: 13,
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Direkt tracking başlat — geolocator kendi izin dialogunu gösterir
    Future.microtask(() {
      if (mounted) ref.read(locationProvider.notifier).startTracking();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _showPermissionRationale) {
      _checkAndStartLocation();
    }
  }

  Future<void> _checkAndStartLocation() async {
    var status = await Permission.locationWhenInUse.status;
    if (!mounted) return;

    if (status.isGranted || status.isLimited) {
      setState(() => _showPermissionRationale = false);
      ref.read(locationProvider.notifier).startTracking();
      return;
    }

    // Direkt sistem dialogunu göster
    status = await Permission.locationWhenInUse.request();
    if (!mounted) return;

    if (status.isGranted || status.isLimited) {
      setState(() => _showPermissionRationale = false);
      ref.read(locationProvider.notifier).startTracking();
    } else {
      setState(() => _showPermissionRationale = true);
    }
  }

  Set<Polygon> _buildHeatmap(Map<String, int> cells) {
    final maxCount = cells.values.fold(1, (a, b) => a > b ? a : b);
    final polygons = <Polygon>{};
    for (final entry in cells.entries) {
      try {
        final boundary = h3CellBoundary(entry.key);
        final intensity = entry.value / maxCount;
        polygons.add(Polygon(
          polygonId: PolygonId(entry.key),
          points: boundary.map((g) => LatLng(g.lat, g.lon)).toList(),
          fillColor: _heatColor(intensity).withAlpha(110),
          strokeWidth: 0,
          strokeColor: Colors.transparent,
        ));
      } catch (_) {
        continue;
      }
    }
    return polygons;
  }

  Color _heatColor(double intensity) {
    if (intensity < 0.5) {
      return Color.lerp(
          const Color(0xFF0096C7), const Color(0xFFFFB703), intensity * 2)!;
    }
    return Color.lerp(
        const Color(0xFFFFB703), AppColors.pitRed, (intensity - 0.5) * 2)!;
  }

  Future<void> _goToMyLocation() async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 5),
      );
      _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(LatLng(pos.latitude, pos.longitude), 15),
      );
    } catch (_) {
      // Konum alınamazsa İstanbul'a git
      _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(const LatLng(41.0082, 28.9784), 13),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final heatmap = ref.watch(heatmapProvider);
    final isGhost = ref.watch(ghostModeProvider);
    final currentCell = ref.watch(locationProvider).valueOrNull;
    final filters = ref.watch(mapFiltersProvider);
    final hasFilter = !filters.isDefault;
    // allPinsProvider'ı direkt izle — async tamamlanınca harita yeniden çizilir
    final allPins = ref.watch(allPinsProvider).valueOrNull ?? [];
    final pinData = allPins.where((pin) {
      if (filters.pin == PinFilter.all) return true;
      if (filters.pin == PinFilter.flare && pin.type == MapPinType.flare)
        return true;
      if (filters.pin == PinFilter.help && pin.type == MapPinType.help)
        return true;
      if (filters.pin == PinFilter.business && pin.type == MapPinType.business)
        return true;
      return false;
    }).toList();
    final pins = pinData.map((p) => _toMarker(context, p)).toSet();

    return Scaffold(
      backgroundColor: AppColors.surface0,
      body: Stack(
        children: [
          // ── Google Maps ──────────────────────────────────────────────────
          GoogleMap(
            initialCameraPosition: _istanbul,
            onMapCreated: (c) => _mapController = c,
            myLocationEnabled: !isGhost,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            style: _darkMapStyle,
            polygons: heatmap.valueOrNull != null
                ? _buildHeatmap(heatmap.valueOrNull!)
                : {},
            markers: pins,
          ),

          // ── Üst bar ─────────────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + AppSpacing.sm,
            left: AppSpacing.lg,
            right: AppSpacing.lg,
            child: Row(
              children: [
                // Hayalet mod toggle
                _TopBarChip(
                  icon: Icons.visibility_off_outlined,
                  label: isGhost ? 'Hayalet' : 'Görünür',
                  active: isGhost,
                  onTap: () {
                    ref.read(ghostModeProvider.notifier).toggle();
                    if (!isGhost) {
                      ref.read(locationProvider.notifier).stopTracking();
                    } else {
                      ref.read(locationProvider.notifier).startTracking();
                    }
                  },
                ),
                const Spacer(),
                // Filtre butonu
                _TopBarChip(
                  icon: Icons.tune,
                  label: 'Filtre',
                  active: hasFilter,
                  onTap: () => showMapFilterSheet(context),
                ),
              ],
            ),
          ),

          // ── Konum hücresi bilgisi (dev) ──────────────────────────────────
          if (currentCell != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 56,
              left: AppSpacing.lg,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surface2.withAlpha(200),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  currentCell,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textTertiary,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ),

          // ── FAB'lar ─────────────────────────────────────────────────────
          Positioned(
            right: AppSpacing.lg,
            bottom: AppSpacing.xl + AppSpacing.xl,
            child: Column(
              children: [
                _MapFab(
                  icon: Icons.my_location,
                  label: 'Konumum',
                  onPressed: isGhost ? null : _goToMyLocation,
                ),
                const SizedBox(height: AppSpacing.md),
                _MapFab(
                  icon: Icons.camera_alt_outlined,
                  label: 'Snap',
                  onPressed: () {},
                ),
                const SizedBox(height: AppSpacing.md),
                SosPulseWidget(
                  child: _MapFab(
                    icon: Icons.sos,
                    label: 'SOS',
                    color: AppColors.error,
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          ),

          // Heatmap spinner kaldırıldı — WS yokken gereksiz dönüyor

          // ── Konum izni rationale ────────────────────────────────────────
          if (_showPermissionRationale)
            LocationPermissionScreen(
              onGranted: () {
                setState(() => _showPermissionRationale = false);
                ref.read(locationProvider.notifier).startTracking();
              },
              onDismiss: () => setState(() => _showPermissionRationale = false),
            ),
        ],
      ),
    );
  }
}

// ── Pin → Marker (GoRouter navigation) ───────────────────────────────────────

Marker _toMarker(BuildContext context, MapPin pin) => Marker(
      markerId: MarkerId(pin.id),
      position: pin.position,
      icon: BitmapDescriptor.defaultMarkerWithHue(pinHue(pin.type)),
      infoWindow: InfoWindow(
        title: pin.title,
        snippet: pin.subtitle,
        onTap: () => _navigateToPin(context, pin),
      ),
    );

void _navigateToPin(BuildContext context, MapPin pin) {
  switch (pin.type) {
    case MapPinType.flare:
      context.push('/flares/${pin.id}');
    case MapPinType.help:
      // TODO(kisi1): yardım detay ekranı Sprint 3
      break;
    case MapPinType.business:
      // TODO(kisi1): işletme detay ekranı Sprint 3
      break;
  }
}

// ── Üst bar chip ─────────────────────────────────────────────────────────────

class _TopBarChip extends StatelessWidget {
  const _TopBarChip({
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: active
              ? AppColors.pitRed.withAlpha(200)
              : AppColors.surface2.withAlpha(220),
          borderRadius: BorderRadius.circular(AppSpacing.xl),
          border: Border.all(
            color: active ? AppColors.pitRed : AppColors.surface3,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 16,
                color: active ? Colors.white : AppColors.textSecondary),
            const SizedBox(width: AppSpacing.xs),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: active ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── FAB ──────────────────────────────────────────────────────────────────────

class _MapFab extends StatelessWidget {
  const _MapFab({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.color,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: FloatingActionButton.small(
        heroTag: label,
        backgroundColor: onPressed == null
            ? AppColors.surface3
            : (color ?? AppColors.pitRed),
        foregroundColor: Colors.white,
        onPressed: onPressed,
        child: Icon(icon),
      ),
    );
  }
}

// ── Dark map style ────────────────────────────────────────────────────────────

const _darkMapStyle = '''[
  {"elementType":"geometry","stylers":[{"color":"#1a1a2e"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#b0b0b0"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#1a1a2e"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#16213e"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#0f0f1a"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]}
]''';
