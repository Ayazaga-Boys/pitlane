import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/constants/app_constants.dart';

class WsService {
  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _reconnectTimer;
  String? _token;

  final _heatmapController = StreamController<Map<String, int>>.broadcast();
  Stream<Map<String, int>> get heatmapStream => _heatmapController.stream;

  void connect(String jwtToken) {
    _token = jwtToken;
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
        // ignore: avoid_print
        print('[WS] error: ${msg['code']} — ${msg['message']}');
    }
  }

  void _onDisconnect() => _scheduleReconnect();

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      if (_token != null) connect(_token!);
    });
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
