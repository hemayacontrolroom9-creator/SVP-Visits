import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.addAll([
      _AuthInterceptor(),
      LogInterceptor(requestBody: false, responseBody: false),
    ]);
  }

  Dio get dio => _dio;

  // ── Auth ──────────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    return res.data['data'];
  }

  Future<void> logout(String refreshToken) async {
    await _dio.post('/auth/logout', data: {'refreshToken': refreshToken});
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final res = await _dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
    return res.data['data'];
  }

  // ── Visits ────────────────────────────────────────────────
  Future<List<dynamic>> getMyVisits({String? status}) async {
    final res = await _dio.get('/visits/my-visits', queryParameters: {'status': status, 'limit': 50});
    return res.data['data']['data'] ?? [];
  }

  Future<List<dynamic>> getTodayVisits() async {
    final res = await _dio.get('/visits/today');
    return res.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> getVisit(String visitId) async {
    final res = await _dio.get('/visits/$visitId');
    return res.data['data'];
  }

  Future<Map<String, dynamic>> checkIn(String visitId, {
    double? latitude, double? longitude, double? accuracy,
    String? qrCode, bool forceCheckIn = false,
  }) async {
    final res = await _dio.post('/visits/$visitId/check-in', data: {
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (accuracy != null) 'accuracy': accuracy,
      if (qrCode != null) 'qrCode': qrCode,
      'forceCheckIn': forceCheckIn,
    });
    return res.data['data'];
  }

  Future<Map<String, dynamic>> checkOut(String visitId, {
    double? latitude, double? longitude, String? notes,
  }) async {
    final res = await _dio.post('/visits/$visitId/check-out', data: {
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (notes != null) 'notes': notes,
    });
    return res.data['data'];
  }

  Future<void> updateGpsTrack(String visitId, List<Map<String, dynamic>> points) async {
    await _dio.patch('/visits/$visitId/gps-track', data: {'points': points});
  }

  // ── Sites ─────────────────────────────────────────────────
  Future<List<dynamic>> getSites() async {
    final res = await _dio.get('/sites', queryParameters: {'limit': 100});
    return res.data['data']['data'] ?? [];
  }

  Future<Map<String, dynamic>> getSite(String siteId) async {
    final res = await _dio.get('/sites/$siteId');
    return res.data['data'];
  }

  // ── Uploads ───────────────────────────────────────────────
  Future<Map<String, dynamic>> uploadPhoto(String filePath, {String folder = 'visits'}) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      'folder': folder,
    });
    final res = await _dio.post('/uploads/photo', data: formData);
    return res.data['data'];
  }

  // ── Checklists ────────────────────────────────────────────
  Future<List<dynamic>> getChecklistTemplates() async {
    final res = await _dio.get('/checklists/templates');
    return res.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> submitChecklist(String visitId, Map<String, dynamic> data) async {
    final res = await _dio.post('/checklists/visits/$visitId/submit', data: data);
    return res.data['data'];
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = StorageService.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final refreshToken = StorageService.getRefreshToken();
      if (refreshToken != null) {
        try {
          final dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
          final res = await dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
          final newToken = res.data['data']['accessToken'];
          await StorageService.saveTokens(newToken, res.data['data']['refreshToken']);
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final retryRes = await dio.fetch(err.requestOptions);
          return handler.resolve(retryRes);
        } catch (_) {
          await StorageService.clearAuth();
        }
      }
    }
    handler.next(err);
  }
}
