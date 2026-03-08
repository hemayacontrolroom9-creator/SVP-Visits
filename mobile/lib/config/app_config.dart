class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api', // Android emulator localhost
  );
  
  static const String wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL', 
    defaultValue: 'ws://10.0.2.2:3000',
  );
  
  static const String googleMapsKey = String.fromEnvironment('GOOGLE_MAPS_KEY');
  
  static const int gpsUpdateIntervalSeconds = 30;
  static const int syncIntervalSeconds = 60;
  static const int maxGpsAccuracyMeters = 50;
  static const double maxGeofenceDistanceMeters = 500;
}
