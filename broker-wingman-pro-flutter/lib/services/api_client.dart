import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

/// Custom exception for API errors
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => message;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode != null && statusCode! >= 500;
  bool get isConnectionError => statusCode == null;
}

/// API Client for making HTTP requests to the FastAPI backend
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String? _accessToken;
  String? _refreshToken;

  /// Initialize the client and load saved tokens
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
    print(
      '[ApiClient] Loaded tokens - accessToken exists: ${_accessToken != null}, refreshToken exists: ${_refreshToken != null}',
    );
  }

  /// Set tokens after login/register
  Future<void> setTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', accessToken);
    await prefs.setString('refresh_token', refreshToken);
    print('[ApiClient] Tokens saved successfully');
  }

  /// Clear tokens on logout
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
  }

  /// Get authorization headers
  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }

    return headers;
  }

  /// Handle HTTP response and parse errors
  dynamic _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    dynamic data;

    try {
      data = json.decode(response.body);
    } catch (_) {
      data = response.body;
    }

    if (statusCode >= 200 && statusCode < 300) {
      return data;
    }

    String message = 'Erro desconhecido';
    if (data is Map && data.containsKey('detail')) {
      message = data['detail'].toString();
    } else if (data is String && data.isNotEmpty) {
      message = data;
    }

    throw ApiException(message, statusCode: statusCode, data: data);
  }

  /// Wrap requests with connection error handling
  Future<T> _withConnectionHandling<T>(Future<T> Function() request) async {
    try {
      return await request().timeout(
        Duration(seconds: ApiConfig.connectTimeout),
        onTimeout: () {
          throw ApiException(
            'Tempo de conexão esgotado. Verifique sua internet.',
          );
        },
      );
    } on TimeoutException {
      throw ApiException('Tempo de conexão esgotado. Verifique sua internet.');
    } on http.ClientException {
      throw ApiException('Erro de conexão. Verifique sua internet.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Sem conexão com a internet. Verifique sua rede.');
    }
  }

  /// Attempt to refresh the access token
  Future<bool> _refreshAccessToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse(ApiConfig.refreshUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refresh_token': _refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await setTokens(
          accessToken: data['access_token'],
          refreshToken: data['refresh_token'],
        );
        return true;
      }
    } catch (_) {
      // Token refresh failed
    }

    await clearTokens();
    return false;
  }

  /// GET request
  Future<dynamic> get(String url, {Map<String, String>? queryParams}) async {
    return _withConnectionHandling(() async {
      Uri uri = Uri.parse(url);
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final response = await http.get(uri, headers: _headers);

      // Handle token expiration
      if (response.statusCode == 401 && _refreshToken != null) {
        if (await _refreshAccessToken()) {
          final retryResponse = await http.get(uri, headers: _headers);
          return _handleResponse(retryResponse);
        }
      }

      return _handleResponse(response);
    });
  }

  /// POST request
  Future<dynamic> post(String url, {dynamic data}) async {
    return _withConnectionHandling(() async {
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: data != null ? json.encode(data) : null,
      );

      // Handle token expiration
      if (response.statusCode == 401 && _refreshToken != null) {
        if (await _refreshAccessToken()) {
          final retryResponse = await http.post(
            Uri.parse(url),
            headers: _headers,
            body: data != null ? json.encode(data) : null,
          );
          return _handleResponse(retryResponse);
        }
      }

      return _handleResponse(response);
    });
  }

  /// PUT request
  Future<dynamic> put(String url, {dynamic data}) async {
    return _withConnectionHandling(() async {
      final response = await http.put(
        Uri.parse(url),
        headers: _headers,
        body: data != null ? json.encode(data) : null,
      );

      // Handle token expiration
      if (response.statusCode == 401 && _refreshToken != null) {
        if (await _refreshAccessToken()) {
          final retryResponse = await http.put(
            Uri.parse(url),
            headers: _headers,
            body: data != null ? json.encode(data) : null,
          );
          return _handleResponse(retryResponse);
        }
      }

      return _handleResponse(response);
    });
  }

  /// DELETE request
  Future<dynamic> delete(String url) async {
    return _withConnectionHandling(() async {
      final response = await http.delete(Uri.parse(url), headers: _headers);

      // Handle token expiration
      if (response.statusCode == 401 && _refreshToken != null) {
        if (await _refreshAccessToken()) {
          final retryResponse = await http.delete(
            Uri.parse(url),
            headers: _headers,
          );
          return _handleResponse(retryResponse);
        }
      }

      return _handleResponse(response);
    });
  }

  /// Check if the API is reachable
  Future<bool> checkHealth() async {
    try {
      await get(ApiConfig.healthUrl);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Get current access token (for debugging)
  String? get accessToken => _accessToken;

  /// Check if user has valid tokens
  bool get hasTokens => _accessToken != null;
}

/// Global API client instance
final apiClient = ApiClient();
