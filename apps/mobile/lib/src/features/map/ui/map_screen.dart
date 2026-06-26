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

import '../../../core/constants/app_constants.dart';
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
import '../providers/vehicle_marker_icon_provider.dart';
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
  StreamSubscription<WsSocialEvent>? _socialEventSub;
  final Map<int, BitmapDescriptor> _vehicleIcons = {};
  bool _showPermissionRationale = false;
  bool _vehicleIconsStartedLoading = false;
  int _vehicleIconAngle = 0;
  double _currentZoom = _istanbul.zoom;
  final Map<String, BitmapDescriptor> _businessMarkerIconCache = {};
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
    _socialEventSub = ref.read(wsServiceProvider).socialEventStream.listen((
      event,
    ) {
      if (!mounted) return;
      _showSocialEventSnackBar(event);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_vehicleIconsStartedLoading) {
      _vehicleIconsStartedLoading = true;
      unawaited(_loadVehicleIcons());
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _helpEventSub?.cancel();
    _socialEventSub?.cancel();
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
        polygons.add(
          Polygon(
            polygonId: PolygonId(entry.key),
            points: boundary.map((g) => LatLng(g.lat, g.lon)).toList(),
            fillColor: _heatColor(intensity).withAlpha(110),
            strokeWidth: 0,
            strokeColor: Colors.transparent,
          ),
        );
      } catch (_) {
        continue;
      }
    }
    return polygons;
  }

  Color _heatColor(double intensity) {
    if (intensity < 0.5) {
      return Color.lerp(
        const Color(0xFF0096C7),
        const Color(0xFFFFB703),
        intensity * 2,
      )!;
    }
    return Color.lerp(
      const Color(0xFFFFB703),
      AppColors.pitRed,
      (intensity - 0.5) * 2,
    )!;
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
      _clusterManager = gmc.ClusterManager<MapPinClusterItem>(items, (markers) {
        if (mounted) setState(() => _clusteredMarkers = markers);
      }, markerBuilder: _buildClusterMarkerWithNav);
      if (_mapController != null) {
        _clusterManager!.setMapId(_mapController!.mapId);
      }
    } else {
      _clusterManager!.setItems(items);
    }
  }

  Future<Marker> _buildClusterMarkerWithNav(
    gmc.Cluster<MapPinClusterItem> cluster,
  ) async {
    if (cluster.count == 1) {
      final pin = cluster.items.first.pin;
      return _toMarker(pin);
    }
    return _buildClusterBadge(cluster);
  }

  Future<Marker> _buildClusterBadge(
    gmc.Cluster<MapPinClusterItem> cluster,
  ) async {
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
    canvas.drawCircle(const Offset(size / 2, size / 2), size / 2 - 1.5, border);

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
    tp.paint(canvas, Offset((size - tp.width) / 2, (size - tp.height) / 2));

    final image = await recorder.endRecording().toImage(
          size.toInt(),
          size.toInt(),
        );
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    final icon = BitmapDescriptor.bytes(bytes!.buffer.asUint8List());

    return Marker(
      markerId: MarkerId('cluster_${cluster.getId()}'),
      position: cluster.location,
      icon: icon,
      infoWindow: InfoWindow(title: '${cluster.count} pin'),
      onTap: () {
        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(cluster.location, 15),
        );
      },
    );
  }

  void _showSocialEventSnackBar(WsSocialEvent event) {
    if (event.type != WsSocialEventType.storyPosted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: const Text('Takip ettiğin biri yeni bir story paylaştı.'),
        action: SnackBarAction(
          label: 'Gör',
          onPressed: () => context.go('/communities'),
        ),
        duration: const Duration(seconds: 4),
      ),
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

  Future<void> _loadVehicleIcons() async {
    if (!AppConstants.isDev) return;

    final configuration = createLocalImageConfiguration(
      context,
      size: const Size(64, 64),
    );
    const basePath = 'assets/vehicle_icons/compact_crossover_green_01';
    const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    final icons = <int, BitmapDescriptor>{};

    for (final angle in angles) {
      final angleName = angle.toString().padLeft(3, '0');
      icons[angle] = await BitmapDescriptor.asset(
        configuration,
        '$basePath/angle_$angleName.png',
        width: 64,
        height: 64,
      );
    }

    if (!mounted) return;
    setState(() => _vehicleIcons.addAll(icons));
  }

  void _handleCameraMove(CameraPosition position) {
    _currentZoom = position.zoom;
    if (!AppConstants.isDev) return;
    final nextAngle = _nearestVehicleAngle(position.bearing);
    if (nextAngle == _vehicleIconAngle) return;
    setState(() => _vehicleIconAngle = nextAngle);
  }

  int _nearestVehicleAngle(double bearing) {
    final normalized =
        bearing.isNegative ? (bearing % 360) + 360 : bearing % 360;
    return ((normalized / 30).round() * 30) % 360;
  }

  Set<Marker> _buildDevVehicleMarkers(String? currentCell) {
    if (!AppConstants.isDev) return {};

    final position = _vehiclePosition(currentCell);
    final selfIconSlug = ref.watch(currentVehicleIconSlugProvider).valueOrNull;
    if (_currentZoom >= 12 &&
        ref
                .read(vehicleMarkerIconCacheProvider)
                .getCachedDescriptor(selfIconSlug, isSelf: true) ==
            null) {
      unawaited(
        ref
            .read(vehicleMarkerIconCacheProvider)
            .getIcon(VehicleIconSlug.fromValue(selfIconSlug), isSelf: true)
            .then((_) {
          if (mounted) setState(() {});
        }),
      );
    }
    final icon = _currentZoom >= 12
        ? (_vehicleIcons[_vehicleIconAngle] ??
            ref
                .watch(vehicleMarkerIconCacheProvider)
                .getCachedDescriptor(selfIconSlug, isSelf: true) ??
            BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen))
        : BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);

    return {
      Marker(
        markerId: const MarkerId('dev_vehicle_compact_crossover_green_01'),
        position: position,
        icon: icon,
        anchor: const Offset(0.5, 0.56),
        zIndexInt: 1000,
        infoWindow: const InfoWindow(
          title: 'Compact crossover demo',
          snippet: 'Sprite marker angle test',
        ),
      ),
    };
  }

  LatLng _vehiclePosition(String? currentCell) {
    if (currentCell != null && currentCell.isNotEmpty) {
      try {
        final center = h3CellCenter(currentCell);
        return LatLng(center.lat, center.lon);
      } catch (_) {
        // Fallback below.
      }
    }
    return const LatLng(41.0102, 28.9808);
  }

  Future<Marker> _toMarker(MapPin pin) async {
    if (pin.type == MapPinType.business) {
      return Marker(
        markerId: MarkerId(pin.id),
        position: pin.position,
        icon: await _businessMarkerIcon(pin, _businessMarkerScale),
        anchor: const Offset(0.5, 0.92),
        zIndexInt: 30,
        infoWindow: InfoWindow(
          title: pin.title,
          snippet: pin.subtitle,
          onTap: () => _showBusinessDetailSheet(pin),
        ),
        onTap: () => _showBusinessDetailSheet(pin),
      );
    }

    if (pin.type == MapPinType.followedUser && _currentZoom >= 12) {
      return Marker(
        markerId: MarkerId(pin.id),
        position: pin.position,
        icon: await ref
            .read(vehicleMarkerIconCacheProvider)
            .getIcon(VehicleIconSlug.fromValue(pin.iconSlug)),
        infoWindow: InfoWindow(
          title: pin.title,
          snippet: pin.subtitle,
          onTap: () => _navigateToPin(pin),
        ),
        onTap: () => _navigateToPin(pin),
      );
    }

    return Marker(
      markerId: MarkerId(pin.id),
      position: pin.position,
      icon: BitmapDescriptor.defaultMarkerWithHue(pinHue(pin.type)),
      infoWindow: InfoWindow(
        title: pin.title,
        snippet: pin.subtitle,
        onTap: () => _navigateToPin(pin),
      ),
      onTap: () => _navigateToPin(pin),
    );
  }

  double get _businessMarkerScale {
    if (_currentZoom < 11) return 0.78;
    if (_currentZoom < 13) return 0.92;
    if (_currentZoom < 15) return 1.0;
    return 1.14;
  }

  Future<BitmapDescriptor> _businessMarkerIcon(MapPin pin, double scale) async {
    final scaleBucket = (scale * 100).round();
    final cacheKey = [
      pin.id,
      pin.photoUrl ?? '',
      pin.title,
      pin.category ?? '',
      scaleBucket,
    ].join('|');
    final cached = _businessMarkerIconCache[cacheKey];
    if (cached != null) return cached;

    final width = 132.0 * scale;
    final height = 82.0 * scale;
    final photoSize = 52.0 * scale;
    final padding = 7.0 * scale;
    final bubbleHeight = 66.0 * scale;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);

    final bubbleRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, width, bubbleHeight),
      Radius.circular(8 * scale),
    );
    canvas.drawRRect(
      bubbleRect,
      Paint()..color = AppColors.surface1.withAlpha(242),
    );
    canvas.drawRRect(
      bubbleRect,
      Paint()
        ..color = AppColors.pitRed.withAlpha(220)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );

    final path = Path()
      ..moveTo(width / 2 - 8 * scale, bubbleHeight)
      ..lineTo(width / 2, height)
      ..lineTo(width / 2 + 8 * scale, bubbleHeight)
      ..close();
    canvas.drawPath(path, Paint()..color = AppColors.surface1.withAlpha(242));

    final photoRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(padding, padding, photoSize, photoSize),
      Radius.circular(26 * scale),
    );
    canvas.save();
    canvas.clipRRect(photoRect);
    final image = await _loadNetworkImage(pin.photoUrl);
    if (image != null) {
      paintImage(
        canvas: canvas,
        rect: Rect.fromLTWH(padding, padding, photoSize, photoSize),
        image: image,
        fit: BoxFit.cover,
      );
    } else {
      canvas.drawRRect(photoRect, Paint()..color = AppColors.surface3);
      _paintCenteredIcon(
        canvas,
        Icons.storefront,
        Rect.fromLTWH(padding, padding, photoSize, photoSize),
      );
    }
    canvas.restore();

    _paintMarkerText(
      canvas,
      pin.title,
      Offset(66 * scale, 11 * scale),
      maxWidth: 58 * scale,
      fontSize: 13 * scale,
      fontWeight: FontWeight.w700,
      color: Colors.white,
      maxLines: 2,
    );
    _paintMarkerText(
      canvas,
      _businessCategoryLabel(pin.category),
      Offset(66 * scale, 42 * scale),
      maxWidth: 58 * scale,
      fontSize: 10 * scale,
      color: AppColors.textTertiary,
      maxLines: 1,
    );

    final imageOut = await recorder.endRecording().toImage(
          width.toInt(),
          height.toInt(),
        );
    final bytes = await imageOut.toByteData(format: ui.ImageByteFormat.png);
    final descriptor = BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      width: width,
      height: height,
    );
    _businessMarkerIconCache[cacheKey] = descriptor;
    return descriptor;
  }

  Future<ui.Image?> _loadNetworkImage(String? url) async {
    if (url == null || url.isEmpty) return null;
    final completer = Completer<ui.Image?>();
    final stream = NetworkImage(url).resolve(ImageConfiguration.empty);
    late final ImageStreamListener listener;
    listener = ImageStreamListener(
      (info, _) {
        if (!completer.isCompleted) completer.complete(info.image);
        stream.removeListener(listener);
      },
      onError: (_, __) {
        if (!completer.isCompleted) completer.complete(null);
        stream.removeListener(listener);
      },
    );
    stream.addListener(listener);
    return completer.future.timeout(
      const Duration(seconds: 3),
      onTimeout: () {
        stream.removeListener(listener);
        return null;
      },
    );
  }

  void _paintCenteredIcon(Canvas canvas, IconData icon, Rect rect) {
    final builder = ui.ParagraphBuilder(
      ui.ParagraphStyle(
        textAlign: TextAlign.center,
        fontSize: 25,
        fontFamily: 'MaterialIcons',
      ),
    )
      ..pushStyle(ui.TextStyle(color: AppColors.textSecondary))
      ..addText(String.fromCharCode(icon.codePoint));
    final paragraph = builder.build()
      ..layout(ui.ParagraphConstraints(width: rect.width));
    canvas.drawParagraph(
      paragraph,
      Offset(rect.left, rect.top + (rect.height - paragraph.height) / 2),
    );
  }

  void _paintMarkerText(
    Canvas canvas,
    String text,
    Offset offset, {
    required double maxWidth,
    required double fontSize,
    Color color = Colors.white,
    FontWeight fontWeight = FontWeight.w500,
    int maxLines = 1,
  }) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: fontWeight,
        ),
      ),
      maxLines: maxLines,
      ellipsis: '…',
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: maxWidth);
    painter.paint(canvas, offset);
  }

  String _businessCategoryLabel(String? category) => switch (category) {
        'garage' => 'Tamirci',
        'dealer' => 'Galeri',
        'parts' => 'Parça',
        'wash' => 'Yıkama',
        'tire' => 'Lastik',
        final String value when value.isNotEmpty => value,
        _ => 'İşletme',
      };

  void _showBusinessDetailSheet(MapPin pin) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => _BusinessLocationSheet(pin: pin),
    );
  }

  void _navigateToPin(MapPin pin) {
    switch (pin.type) {
      case MapPinType.flare:
        context.push('/flares/${pin.id}');
      case MapPinType.help:
        showHelpDetailSheet(context, pin);
      case MapPinType.business:
        _showBusinessDetailSheet(pin);
      case MapPinType.followedUser:
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(pin.subtitle ?? pin.title)));
    }
  }

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
            onCameraMove: (pos) {
              _clusterManager?.onCameraMove(pos);
              _handleCameraMove(pos);
            },
            onCameraIdle: () => _clusterManager?.updateMap(),
            myLocationEnabled: !isGhost,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            style: _darkMapStyle,
            polygons:
                heatmapCells.isNotEmpty ? _buildHeatmap(heatmapCells) : {},
            markers: {
              ..._clusteredMarkers,
              ..._buildDevVehicleMarkers(currentCell),
            },
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

// ── Business detail sheet ────────────────────────────────────────────────────

class _BusinessLocationSheet extends StatelessWidget {
  const _BusinessLocationSheet({required this.pin});

  final MapPin pin;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: pin.photoUrl == null || pin.photoUrl!.isEmpty
                    ? Container(
                        color: AppColors.surface3,
                        child: const Icon(
                          Icons.storefront,
                          color: AppColors.textSecondary,
                          size: 48,
                        ),
                      )
                    : Image.network(
                        pin.photoUrl!,
                        fit: BoxFit.cover,
                        gaplessPlayback: true,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.surface3,
                          child: const Icon(
                            Icons.storefront,
                            color: AppColors.textSecondary,
                            size: 48,
                          ),
                        ),
                      ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              pin.title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            if (pin.subtitle != null && pin.subtitle!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                pin.subtitle!,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
            if (pin.address != null && pin.address!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.place_outlined,
                    size: 18,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      pin.address!,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed:
                        pin.phone == null || pin.phone!.isEmpty ? null : () {},
                    icon: const Icon(Icons.phone_outlined),
                    label: const Text('Ara'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.map_outlined),
                    label: const Text('Haritada'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
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
            Icon(
              icon,
              size: 16,
              color: active ? Colors.white : AppColors.textSecondary,
            ),
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
