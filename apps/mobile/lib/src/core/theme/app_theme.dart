import 'package:flutter/material.dart';

class AppTheme {
  const AppTheme._();

  static const _pitRed = Color(0xFFE63946);
  static const _pitInk = Color(0xFF111318);
  static const _pitSurface = Color(0xFF1A1D24);

  static ThemeData get darkTheme {
    final scheme = ColorScheme.fromSeed(
      seedColor: _pitRed,
      brightness: Brightness.dark,
      surface: _pitSurface,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: _pitInk,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: _pitInk,
        foregroundColor: Colors.white,
      ),
    );
  }
}
