abstract final class AppConstants {
  static const appName = 'Pitlane';

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  static const wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: 'ws://localhost:8080',
  );

  static const apiTimeoutSeconds = 8;

  static const isDev =
      bool.fromEnvironment('DART_VM_FLAGS', defaultValue: true);
}
