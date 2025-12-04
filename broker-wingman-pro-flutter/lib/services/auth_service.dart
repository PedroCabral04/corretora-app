import '../config/api_config.dart';
import '../models/user.dart';
import 'api_client.dart';

/// Response from login/register endpoints
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final User user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token'] ?? '',
      refreshToken: json['refresh_token'] ?? '',
      tokenType: json['token_type'] ?? 'bearer',
      user: User.fromJson(json['user'] ?? {}),
    );
  }
}

/// Authentication service for handling login, register, and token management
class AuthService {
  final ApiClient _client = apiClient;

  /// Login with email and password
  Future<AuthResponse> login(String email, String password) async {
    final data = await _client.post(
      ApiConfig.loginUrl,
      data: {'email': email, 'password': password},
    );

    final response = AuthResponse.fromJson(data);

    // Save tokens
    await _client.setTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );

    return response;
  }

  /// Register a new user
  Future<AuthResponse> register({
    required String name,
    required String email,
    required String password,
    UserRole role = UserRole.broker,
  }) async {
    final data = await _client.post(
      ApiConfig.registerUrl,
      data: {
        'name': name,
        'email': email,
        'password': password,
        'role': role.name,
      },
    );

    final response = AuthResponse.fromJson(data);

    // Save tokens
    await _client.setTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );

    return response;
  }

  /// Get current user profile
  Future<User> getCurrentUser() async {
    final data = await _client.get(ApiConfig.meUrl);
    return User.fromJson(data);
  }

  /// Update current user profile
  Future<User> updateProfile({String? name, String? email}) async {
    final updateData = <String, dynamic>{};
    if (name != null) updateData['name'] = name;
    if (email != null) updateData['email'] = email;

    final data = await _client.put(ApiConfig.meUrl, data: updateData);
    return User.fromJson(data);
  }

  /// Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _client.post(
      ApiConfig.changePasswordUrl,
      data: {'current_password': currentPassword, 'new_password': newPassword},
    );
  }

  /// Logout - clear tokens
  Future<void> logout() async {
    await _client.clearTokens();
  }

  /// Check if user is authenticated (has valid tokens)
  bool get isAuthenticated => _client.hasTokens;

  /// Initialize service and load saved tokens
  Future<void> init() async {
    await _client.init();
  }
}

/// Global auth service instance
final authService = AuthService();
