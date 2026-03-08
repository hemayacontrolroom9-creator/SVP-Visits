import 'package:hive_flutter/hive_flutter.dart';
import 'dart:convert';

class StorageService {
  static late Box _authBox;
  static late Box _visitBox;
  static late Box _syncBox;

  static Future<void> init() async {
    _authBox = await Hive.openBox('auth');
    _visitBox = await Hive.openBox('visits');
    _syncBox = await Hive.openBox('sync_queue');
  }

  // ── Auth ──────────────────────────────────────────────────
  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _authBox.put('access_token', accessToken);
    await _authBox.put('refresh_token', refreshToken);
  }

  static String? getAccessToken() => _authBox.get('access_token');
  static String? getRefreshToken() => _authBox.get('refresh_token');

  static Future<void> saveUser(Map<String, dynamic> user) async {
    await _authBox.put('user', jsonEncode(user));
  }

  static Map<String, dynamic>? getUser() {
    final data = _authBox.get('user');
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  static bool get isAuthenticated => getAccessToken() != null;

  static Future<void> clearAuth() async {
    await _authBox.deleteAll(['access_token', 'refresh_token', 'user']);
  }

  // ── Offline Visit Cache ───────────────────────────────────
  static Future<void> cacheVisit(String visitId, Map<String, dynamic> visit) async {
    await _visitBox.put(visitId, jsonEncode(visit));
  }

  static Map<String, dynamic>? getCachedVisit(String visitId) {
    final data = _visitBox.get(visitId);
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  static Future<void> cacheVisits(List<Map<String, dynamic>> visits) async {
    for (final v in visits) {
      await cacheVisit(v['id'], v);
    }
  }

  static List<Map<String, dynamic>> getCachedVisits() {
    return _visitBox.values
        .map((v) => jsonDecode(v) as Map<String, dynamic>)
        .toList();
  }

  // ── Sync Queue ────────────────────────────────────────────
  static Future<void> addToSyncQueue(Map<String, dynamic> action) async {
    final key = '${DateTime.now().millisecondsSinceEpoch}';
    await _syncBox.put(key, jsonEncode(action));
  }

  static List<MapEntry<String, Map<String, dynamic>>> getSyncQueue() {
    return _syncBox.toMap().entries
        .map((e) => MapEntry(e.key as String, jsonDecode(e.value) as Map<String, dynamic>))
        .toList();
  }

  static Future<void> removeSyncItem(String key) async {
    await _syncBox.delete(key);
  }
}
