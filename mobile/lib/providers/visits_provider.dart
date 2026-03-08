import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../models/visit_model.dart';

final visitsProvider = FutureProvider<List<VisitModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final data = await api.getMyVisits();
    final visits = data.map((v) => VisitModel.fromJson(Map<String, dynamic>.from(v))).toList();
    await StorageService.cacheVisits(data.map((v) => Map<String, dynamic>.from(v)).toList());
    return visits;
  } catch (e) {
    // Return cached data when offline
    final cached = StorageService.getCachedVisits();
    return cached.map((v) => VisitModel.fromJson(v)).toList();
  }
});

final todayVisitsProvider = FutureProvider<List<VisitModel>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final data = await api.getTodayVisits();
    return data.map((v) => VisitModel.fromJson(Map<String, dynamic>.from(v))).toList();
  } catch (e) {
    return [];
  }
});

final visitDetailProvider = FutureProvider.family<VisitModel?, String>((ref, visitId) async {
  final api = ref.read(apiServiceProvider);
  try {
    final data = await api.getVisit(visitId);
    return VisitModel.fromJson(Map<String, dynamic>.from(data));
  } catch (e) {
    final cached = StorageService.getCachedVisit(visitId);
    if (cached != null) return VisitModel.fromJson(cached);
    return null;
  }
});
