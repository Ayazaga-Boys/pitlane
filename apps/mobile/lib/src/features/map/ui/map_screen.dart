import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_cluster_manager_2/google_maps_cluster_manager_2.dart'
    as gmc;
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/location_utils.dart';
import '../data/ws_service.dart';
import '../providers/followed_user_locations_provider.dart';
import '../providers/ghost_mode_provider.dart';
import '../providers/location_provider.dart';
import '../providers/map_cluster_provider.dart';
import '../providers/map_heatmap_provider.dart';
import '../providers/map_pins_provider.dart';
import 'location_permission_screen.dart';
import 'map_filter_sheet.dart';
import 'help_detail_sheet.dart';
import 'sos_pulse_widget.dart';
import 'sos_sheet.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen>
    with WidgetsBindingObserver {
  GoogleMapController? _mapController;
  StreamSubscription<WsHelpEvent>? _helpEventSub;
  bool _showPermissionRationale = false;
  Set<Marker> _clusteredMarkers = {};
  gmc.ClusterManager<MapPinClusterItem>? _clusterManager;

  static const _istanbul = CameraPosition(
    target: LatLng(41.0082, 28.9784),
    zoom: 13,
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Direkt tracking başlat — geolocator kendi izin dialogunu gösterir
    Future.microtask(() async {
      if (!mounted) return;
      ref.read(locationProvider.notifier).startTracking();
      // GPS hazır olunca haritayı oraya odakla
      await Future<void>.delayed(const Duration(seconds: 2));
      if (!mounted) return;
      final cell = ref.read(locationProvider).valueOrNull;
      if (cell != null && _mapController != null) {
        _goToMyLocation();
      }
    });
    _helpEventSub = ref.read(wsServiceProvider).helpEventStream.listen((event) {
      if (!mounted) return;
      _showHelpEventSnackBar(event);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _helpEventSub?.cancel();
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

  void _updateClusterManager(List<MapPin> pins) {
    final items = pins.map(MapPinClusterItem.new).toList();
    if (_clusterManager == null) {
      _clusterManager = gmc.ClusterManager<MapPinClusterItem>(
        items,
        (markers) {
          if (mounted) setState(() => _clusteredMarkers = markers);
        },
        markerBuilder: _buildClusterMarkerWithNav,
      );
      if (_mapController != null) {
        _clusterManager!.setMapId(_mapController!.mapId);
      }
    } else {
      _clusterManager!.setItems(items);
    }
  }

  Future<Marker> _buildClusterMarkerWithNav(
      gmc.Cluster<MapPinClusterItem> cluster) async {
    if (cluster.count == 1) {
      final pin = cluster.items.first.pin;
      return _toMarker(context, pin);
    }
    return _buildClusterBadge(cluster);
  }

  Future<Marker> _buildClusterBadge(
      gmc.Cluster<MapPinClusterItem> cluster) async {
    const size = 56.0;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);

    final paint = Paint()
      ..color = AppColors.pitRed
      ..style = PaintingStyle.fill;
    canvas.drawCircle(const Offset(size / 2, size / 2), size / 2, paint);

    final border = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(
        const Offset(size / 2, size / 2), size / 2 - 1.5, border);

    final tp = TextPainter(
      text: TextSpan(
        text: '${cluster.count}',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas,
        Offset((size - tp.width) / 2, (size - tp.height) / 2));

    final image = await recorder
        .endRecording()
        .toImage(size.toInt(), size.toInt());
    final bytes =
        await image.toByteData(format: ui.ImageByteFormat.png);
    final icon = BitmapDescriptor.bytes(bytes!.buffer.asUint8List());

    return Marker(
      markerId: MarkerId('cluster_${cluster.getId()}'),
      position: cluster.location,
      icon: icon,
      infoWindow: InfoWindow(title: '${cluster.count} pin'),
    );
  }

  void _showHelpEventSnackBar(WsHelpEvent event) {
    if (event.type != WsHelpEventType.nearby) return;

    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(_helpEventMessage(event.issueType)),
        action: SnackBarAction(
          label: 'Aç',
          onPressed: () => context.go('/help/${event.helpId}'),
        ),
      ),
    );
  }

  String _helpEventMessage(String? issueType) => switch (issueType) {
        'breakdown' => 'Yakında arıza yardımı istendi.',
        'flat_tire' => 'Yakında lastik yardımı istendi.',
        'fuel' => 'Yakında yakıt yardımı istendi.',
        'accident' => 'Yakında kaza yardımı istendi.',
        _ => 'Yakında yeni yardım talebi var.',
      };

  @override
  Widget build(BuildContext context) {
    final isGhost = ref.watch(ghostModeProvider);
    final currentCell = ref.watch(locationProvider).valueOrNull;
    final filters = ref.watch(mapFiltersProvider);
    final liveHeatmap = ref.watch(heatmapProvider);
    final vehicleHeatmap = filters.vehicle == VehicleFilter.all
        ? null
        : ref.watch(vehicleHeatmapProvider(filters.vehicle));
    final heatmapCells =
        vehicleHeatmap?.valueOrNull ?? liveHeatmap.valueOrNull ?? {};
    final hasFilter = !filters.isDefault;
    // allPinsProvider'ı direkt izle — async tamamlanınca harita yeniden çizilir
    final pinsAsync = ref.watch(allPinsProvider);
    final allPins = pinsAsync.valueOrNull ?? [];
    final followedPins = ref.watch(followedUserPinsProvider);
    final pinsLoading = pinsAsync.isLoading;
    final pinData = [...allPins, ...followedPins].where((pin) {
      if (filters.hideBusinesses && pin.type == MapPinType.business) {
        return false;
      }
      if (filters.pin == PinFilter.all) {
        return true;
      }
      if (filters.pin == PinFilter.flare && pin.type == MapPinType.flare) {
        return true;
      }
      if (filters.pin == PinFilter.help && pin.type == MapPinType.help) {
        return true;
      }
      if (filters.pin == PinFilter.business &&
          pin.type == MapPinType.business) {
        return true;
      }
      if (filters.pin == PinFilter.followed &&
          pin.type == MapPinType.followedUser) {
        return true;
      }
      return false;
    }).toList();
    // Clustering — pin listesi değişince manager'ı güncelle
    _updateClusterManager(pinData);

    return Scaffold(
      backgroundColor: AppColors.surface0,
      body: Stack(
        children: [
          // ── Google Maps ──────────────────────────────────────────────────
          GoogleMap(
            initialCameraPosition: _istanbul,
            onMapCreated: (c) {
              _mapController = c;
              _clusterManager?.setMapId(c.mapId);
            },
            onCameraMove: (pos) => _clusterManager?.onCameraMove(pos),
            onCameraIdle: () => _clusterManager?.updateMap(),
            myLocationEnabled: !isGhost,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            style: _darkMapStyle,
            polygons:
                heatmapCells.isNotEmpty ? _buildHeatmap(heatmapCells) : {},
            markers: _clusteredMarkers,
          ),

          // ── Pin yükleniyor göstergesi ────────────────────────────────────
          if (pinsLoading)
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                minHeight: 2,
                backgroundColor: Colors.transparent,
                color: AppColors.pitRed,
              ),
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
                  onPressed: () => context.push('/camera'),
                ),
                const SizedBox(height: AppSpacing.md),
                SosPulseWidget(
                  child: _MapFab(
                    icon: Icons.sos,
                    label: 'SOS',
                    color: AppColors.error,
                    onPressed: () => showSosSheet(context, ref),
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
      showHelpDetailSheet(context, pin);
    case MapPinType.business:
      context.push('/pins/${pin.id}');
    case MapPinType.followedUser:
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(pin.subtitle ?? pin.title)),
      );
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
