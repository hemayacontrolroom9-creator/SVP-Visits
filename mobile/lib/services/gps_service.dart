import 'package:geolocator/geolocator.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

final gpsServiceProvider = Provider<GpsService>((ref) => GpsService());

class GpsService {
  StreamSubscription<Position>? _positionStream;
  Position? _lastPosition;

  Future<bool> requestPermissions() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.whileInUse ||
           permission == LocationPermission.always;
  }

  Future<Position?> getCurrentPosition() async {
    if (!await requestPermissions()) return null;
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (e) {
      return await Geolocator.getLastKnownPosition();
    }
  }

  void startTracking(void Function(Position) onLocation, {int intervalSeconds = 30}) {
    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );
    _positionStream = Geolocator.getPositionStream(locationSettings: settings).listen(onLocation);
  }

  void stopTracking() {
    _positionStream?.cancel();
    _positionStream = null;
  }

  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }

  bool isWithinGeofence(Position position, double siteLat, double siteLng, double radiusMeters) {
    final distance = calculateDistance(position.latitude, position.longitude, siteLat, siteLng);
    return distance <= radiusMeters;
  }

  Position? get lastPosition => _lastPosition;
}
