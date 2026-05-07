import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'src/core/constants/app_constants.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Supabase — credentials .env'den dart-define ile gelir.
  // Erol (Kişi 2) Supabase projesini oluşturunca bu değerler dolar.
  if (AppConstants.supabaseUrl.isNotEmpty) {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
      debug: AppConstants.isDev,
    );
  }

  runApp(const ProviderScope(child: PitlaneApp()));
}
