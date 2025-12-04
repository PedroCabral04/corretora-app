/// API Configuration for the Corretora App
class ApiConfig {
  // Base URL for the FastAPI backend
  // Change this to your production URL when deploying
  static const String baseUrl = 'http://localhost:8000';

  // API version prefix
  static const String apiPrefix = '/api/v1';

  // Full API URL
  static String get apiUrl => '$baseUrl$apiPrefix';

  // Request timeout in seconds
  static const int connectTimeout = 30;
  static const int receiveTimeout = 30;

  // Auth endpoints
  static String get loginUrl => '$apiUrl/auth/login';
  static String get registerUrl => '$apiUrl/auth/register';
  static String get refreshUrl => '$apiUrl/auth/refresh';
  static String get meUrl => '$apiUrl/auth/me';
  static String get changePasswordUrl => '$apiUrl/auth/change-password';
  static String get forgotPasswordUrl => '$apiUrl/auth/forgot-password';
  static String get logoutUrl => '$apiUrl/auth/logout';

  // Resource endpoints
  static String get brokersUrl => '$apiUrl/brokers';
  static String get clientsUrl => '$apiUrl/clients';
  static String get salesUrl => '$apiUrl/sales';
  static String get listingsUrl => '$apiUrl/listings';
  static String get tasksUrl => '$apiUrl/tasks';
  static String get eventsUrl => '$apiUrl/events';
  static String get meetingsUrl => '$apiUrl/meetings';
  static String get expensesUrl => '$apiUrl/expenses';
  static String get goalsUrl => '$apiUrl/goals';
  static String get notificationsUrl => '$apiUrl/notifications';
  static String get challengesUrl => '$apiUrl/challenges';
  static String get adminUrl => '$apiUrl/admin';

  // Health check
  static String get healthUrl => '$baseUrl/health';
}
