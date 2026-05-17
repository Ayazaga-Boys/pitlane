import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'src/core/constants/app_constants.dart';
import 'src/features/notifications/data/firebase_push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebasePushBootstrap.ensureInitialized();

  // Supabase — credentials .env'den dart-define ile gelir.
  // Erol (Kişi 2) Supabase projesini oluşturunca bu değerler dolar.
  if (AppConstants.supabaseUrl.isNotEmpty) {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
      debug: AppConstants.isDev,
      authOptions: const FlutterAuthClientOptions(
        authFlowType:
            AuthFlowType.implicit, // PKCE yerine implicit — numeric OTP alır
      ),
    );
  }

  runApp(const ProviderScope(child: RollpitApp()));
}
