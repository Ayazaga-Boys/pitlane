import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/constants/app_constants.dart';

// Reconnect backoff: 3s → 6s → 12s → … max 60s
const _backoffBase = Duration(seconds: 3);
const _backoffMax = Duration(seconds: 60);

class WsService {
  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _reconnectTimer;
  String? _token;
  int _reconnectAttempts = 0;

  final _heatmapController = StreamController<Map<String, int>>.broadcast();
  Stream<Map<String, int>> get heatmapStream => _heatmapController.stream;

  void connect(String jwtToken) {
    _token = jwtToken;
    _reconnectAttempts = 0; // başarılı bağlantı — backoff sıfırla
    _channel = WebSocketChannel.connect(
      Uri.parse('${AppConstants.wsBaseUrl}/ws/location?token=$jwtToken'),
    );
    _sub = _channel!.stream.listen(
      _onMessage,
      onDone: _onDisconnect,
      onError: (_) => _scheduleReconnect(),
    );
  }

  void sendLocation(String h3Cell) {
    _send({'type': 'location', 'h3_cell': h3Cell});
  }

  void sendGhostOn() {
    _send({'type': 'ghost_on'});
  }

  void sendGhostOff() {
    _send({'type': 'ghost_off'});
  }

  void _onMessage(dynamic raw) {
    final msg = jsonDecode(raw as String) as Map<String, dynamic>;
    switch (msg['type']) {
      case 'heatmap_update':
        final cells = (msg['cells'] as Map<String, dynamic>)
            .map((k, v) => MapEntry(k, v as int));
        _heatmapController.add(cells);
      case 'error':
        debugPrint('[WS] error: ${msg['code']} — ${msg['message']}');
    }
  }

  void _onDisconnect() => _scheduleReconnect();

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectAttempts++;
    final delay = _backoffDelay(_reconnectAttempts);
    _reconnectTimer = Timer(delay, () {
      if (_token != null) connect(_token!);
    });
  }

  /// Exponential backoff: 3s × 2^(attempt-1), max 60s
  static Duration _backoffDelay(int attempt) {
    final seconds = _backoffBase.inSeconds * (1 << (attempt - 1).clamp(0, 4));
    return Duration(seconds: seconds.clamp(0, _backoffMax.inSeconds));
  }

  void _send(Map<String, dynamic> payload) {
    _channel?.sink.add(jsonEncode(payload));
  }

  void dispose() {
    _reconnectTimer?.cancel();
    _sub?.cancel();
    _channel?.sink.close();
    _heatmapController.close();
  }
}

final wsServiceProvider = Provider<WsService>((ref) {
  final service = WsService();
  ref.onDispose(service.dispose);
  return service;
});
