import 'api_exceptions.dart';

/// Generic structured API response model for Popo Live mobile
class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? message;
  final String? errorCode;
  final int statusCode;
  final ApiException? exception;

  const ApiResponse._({
    required this.isSuccess,
    this.data,
    this.message,
    this.errorCode,
    required this.statusCode,
    this.exception,
  });

  /// Successful response with parsed payload
  factory ApiResponse.success(T data, {int statusCode = 200, String? message}) {
    return ApiResponse._(
      isSuccess: true,
      data: data,
      statusCode: statusCode,
      message: message,
    );
  }

  /// Failure response with error information
  factory ApiResponse.failure(
    String message, {
    int statusCode = 400,
    String? errorCode,
    T? data,
  }) {
    return ApiResponse._(
      isSuccess: false,
      message: message,
      statusCode: statusCode,
      errorCode: errorCode,
      data: data,
    );
  }

  /// Failure response wrapped from an ApiException
  factory ApiResponse.fromException(ApiException exception) {
    return ApiResponse._(
      isSuccess: false,
      message: exception.message,
      statusCode: exception.statusCode,
      errorCode: exception.code,
      exception: exception,
    );
  }

  /// Convenience getters
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode >= 500;
  bool get isNetworkError => statusCode == 0;

  @override
  String toString() {
    return 'ApiResponse<$T>(isSuccess: $isSuccess, statusCode: $statusCode, message: $message)';
  }
}
