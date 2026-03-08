import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthState {
  final bool isAuthenticated;
  final Map<String, dynamic>? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({bool? isAuthenticated, Map<String, dynamic>? user, bool? isLoading, String? error}) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(AuthState(
    isAuthenticated: StorageService.isAuthenticated,
    user: StorageService.getUser(),
  ));

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _apiService.login(email, password);
      await StorageService.saveTokens(data['accessToken'], data['refreshToken']);
      await StorageService.saveUser(Map<String, dynamic>.from(data['user']));
      state = state.copyWith(isAuthenticated: true, user: data['user'], isLoading: false);
    } catch (e) {
      final msg = e.toString().contains('401') ? 'Invalid email or password' : 'Login failed. Check connection.';
      state = state.copyWith(isLoading: false, error: msg);
    }
  }

  Future<void> logout() async {
    try {
      final token = StorageService.getRefreshToken();
      if (token != null) await _apiService.logout(token);
    } catch (_) {}
    await StorageService.clearAuth();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiServiceProvider));
});
