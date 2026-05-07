import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase istemcisine erişim.
/// main.dart'ta Supabase.initialize() çağrıldıktan sonra kullanılabilir.
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});
