/// Base class for all API errors
class ApiException implements Exception {
  final String message;
  final int statusCode;
  final String? code;
  final dynamic details;

  const ApiException({
    required this.message,
    this.statusCode = 0,
    this.code,
    this.details,
  });

  @override
  String toString() => 'ApiException: [$statusCode] $message (code: $code)';
}

/// Thrown when device has no internet connection or socket connection fails
class NetworkException extends ApiException {
  const NetworkException({
    String message =
        'Unable to connect to server. Please check your internet connection.',
  }) : super(message: message, statusCode: 0, code: 'NETWORK_ERROR');
}

/// Thrown when an HTTP request exceeds configured timeout threshold
class ApiTimeoutException extends ApiException {
  const ApiTimeoutException({
    String message = 'The server took too long to respond. Please try again.',
  }) : super(message: message, statusCode: 408, code: 'REQUEST_TIMEOUT');
}

/// Thrown when user credentials or session token are missing, invalid, or expired (HTTP 401)
class UnauthorizedException extends ApiException {
  const UnauthorizedException({
    String message = 'Session expired. Please log in again.',
    String? code = 'UNAUTHORIZED',
  }) : super(message: message, statusCode: 401, code: code);
}

/// Thrown when access is forbidden, e.g. 18+ terms gate required or account suspended (HTTP 403)
class ForbiddenException extends ApiException {
  const ForbiddenException({
    String message =
        'Access denied. You do not have permission to view this resource.',
    String? code = 'FORBIDDEN',
  }) : super(message: message, statusCode: 403, code: code);
}

/// Thrown when endpoint or resource does not exist (HTTP 404)
class NotFoundException extends ApiException {
  const NotFoundException({
    String message = 'The requested resource was not found on the server.',
    String? code = 'NOT_FOUND',
  }) : super(message: message, statusCode: 404, code: code);
}

/// Thrown when request body fails validation (HTTP 400 or 422)
class ValidationException extends ApiException {
  const ValidationException({
    required String message,
    String? code = 'VALIDATION_FAILED',
    dynamic details,
  }) : super(message: message, statusCode: 400, code: code, details: details);
}

/// Thrown when server returns an internal error, 502 Bad Gateway, or 503 Unavailable
class ServerException extends ApiException {
  const ServerException({
    String message =
        'Server error encountered. Our technical team has been notified.',
    int statusCode = 500,
    String? code = 'SERVER_ERROR',
  }) : super(message: message, statusCode: statusCode, code: code);
}

/// Thrown when server returns an unparseable response (e.g. unexpected HTML error page)
class ParseException extends ApiException {
  const ParseException({
    String message = 'Failed to parse response from server.',
  }) : super(message: message, statusCode: 0, code: 'PARSE_ERROR');
}
