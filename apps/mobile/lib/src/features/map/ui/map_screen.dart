import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/location_utils.dart';
import '../providers/location_provider.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  GoogleMapController? _mapController;
  static const _defaultPosition = CameraPosition(
    target: LatLng(41.0082, 28.9784), // İstanbul merkez
    zoom: 13,
  );

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      await Geolocator.requestPermission();
    }
    if (!mounted) return;
    ref.read(locationProvider.notifier).startTracking();
  }

  Set<Polygon> _buildHeatmap(Map<String, int> cells) {
    final maxCount = cells.values.fold(1, (a, b) => a > b ? a : b);
    final polygons = <Polygon>{};
    for (final entry in cells.entries) {
      final boundary = h3CellBoundary(entry.key);
      final intensity = entry.value / maxCount;
      polygons.add(Polygon(
        polygonId: PolygonId(entry.key),
        points: boundary.map((g) => LatLng(g.lat, g.lon)).toList(),
        fillColor: _heatColor(intensity).withAlpha(110),
        strokeWidth: 0,
        strokeColor: Colors.transparent,
      ));
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

  @override
  Widget build(BuildContext context) {
    final heatmap = ref.watch(heatmapProvider);

    return Scaffold(
      backgroundColor: AppColors.surface0,
      body: Stack(
        children: [
          AppConstants.googleMapsApiKey.isEmpty
              ? _NoApiKeyPlaceholder()
              : GoogleMap(
                  initialCameraPosition: _defaultPosition,
                  onMapCreated: (c) => _mapController = c,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  mapToolbarEnabled: false,
                  style: _darkMapStyle,
                  polygons: heatmap.valueOrNull != null
                      ? _buildHeatmap(heatmap.valueOrNull!)
                      : {},
                ),

          // FAB'lar
          Positioned(
            right: AppSpacing.lg,
            bottom: AppSpacing.xl + AppSpacing.xl,
            child: Column(
              children: [
                _MapFab(
                  icon: Icons.my_location,
                  label: 'Konumum',
                  onPressed: _goToMyLocation,
                ),
                const SizedBox(height: AppSpacing.md),
                _MapFab(
                  icon: Icons.camera_alt_outlined,
                  label: 'Snap',
                  onPressed: () {},
                ),
                const SizedBox(height: AppSpacing.md),
                _MapFab(
                  icon: Icons.sos,
                  label: 'SOS',
                  color: AppColors.error,
                  onPressed: () {},
                ),
              ],
            ),
          ),

          if (heatmap.isLoading)
            const Positioned(
              top: 60,
              left: 0,
              right: 0,
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.pitRed,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _goToMyLocation() async {
    final pos = await Geolocator.getCurrentPosition();
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(LatLng(pos.latitude, pos.longitude), 15),
    );
  }
}

class _NoApiKeyPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.map_outlined, size: 64, color: AppColors.pitRed),
          const SizedBox(height: AppSpacing.md),
          Text('Harita',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: AppSpacing.sm),
          Text('GOOGLE_MAPS_API_KEY lazım — Erol\'dan iste',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textTertiary)),
        ],
      ),
    );
  }
}

class _MapFab extends StatelessWidget {
  const _MapFab(
      {required this.icon,
      required this.label,
      required this.onPressed,
      this.color});
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: FloatingActionButton.small(
        heroTag: label,
        backgroundColor: color ?? AppColors.pitRed,
        foregroundColor: Colors.white,
        onPressed: onPressed,
        child: Icon(icon),
      ),
    );
  }
}

const _darkMapStyle = '''[
  {"elementType":"geometry","stylers":[{"color":"#1a1a2e"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#b0b0b0"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#1a1a2e"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#16213e"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#0f0f1a"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]}
]''';
