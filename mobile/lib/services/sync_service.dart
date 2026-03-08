import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'storage_service.dart';

final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(ref.read(apiServiceProvider));
});

class SyncService {
  final ApiService _apiService;
  bool _isSyncing = false;

  SyncService(this._apiService);

  Future<void> syncPendingActions() async {
    if (_isSyncing) return;
    
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult == ConnectivityResult.none) return;

    _isSyncing = true;
    try {
      final queue = StorageService.getSyncQueue();
      for (final entry in queue) {
        try {
          await _processSyncAction(entry.value);
          await StorageService.removeSyncItem(entry.key);
        } catch (e) {
          // Keep in queue for retry
          print('Sync failed for ${entry.key}: $e');
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _processSyncAction(Map<String, dynamic> action) async {
    final type = action['type'] as String;
    final data = action['data'] as Map<String, dynamic>;

    switch (type) {
      case 'check_in':
        await _apiService.checkIn(
          data['visitId'],
          latitude: data['latitude'],
          longitude: data['longitude'],
          qrCode: data['qrCode'],
        );
        break;
      case 'check_out':
        await _apiService.checkOut(
          data['visitId'],
          latitude: data['latitude'],
          longitude: data['longitude'],
          notes: data['notes'],
        );
        break;
      case 'gps_track':
        await _apiService.updateGpsTrack(data['visitId'], List<Map<String, dynamic>>.from(data['points']));
        break;
      case 'upload_photo':
        await _apiService.uploadPhoto(data['filePath'], folder: data['folder']);
        break;
    }
  }

  Future<void> queueAction(String type, Map<String, dynamic> data) async {
    await StorageService.addToSyncQueue({'type': type, 'data': data, 'timestamp': DateTime.now().toIso8601String()});
  }
}
