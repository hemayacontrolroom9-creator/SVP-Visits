import 'dart:math';

class LocationUtils {
  LocationUtils._();

  /// Haversine formula — returns distance in meters
  static double distanceBetween(
    double lat1, double lon1,
    double lat2, double lon2,
  ) {
    const R = 6371000.0;
    final dLat = _toRad(lat2 - lat1);
    final dLon = _toRad(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRad(lat1)) * cos(_toRad(lat2)) * sin(dLon / 2) * sin(dLon / 2);
    return R * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  static bool isWithinGeofence(
    double checkLat, double checkLon,
    double siteLat, double siteLon,
    double radiusMeters,
  ) {
    return distanceBetween(checkLat, checkLon, siteLat, siteLon) <= radiusMeters;
  }

  static String formatDistance(double meters) {
    if (meters < 1000) return '${meters.round()}m';
    return '${(meters / 1000).toStringAsFixed(1)}km';
  }

  static String formatCoordinate(double lat, double lon) {
    return '${lat.toStringAsFixed(6)}, ${lon.toStringAsFixed(6)}';
  }

  static double _toRad(double deg) => deg * pi / 180;
}
