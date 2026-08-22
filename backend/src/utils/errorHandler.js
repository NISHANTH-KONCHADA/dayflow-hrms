import { ApiError, ApiResponse } from './apiResponse.js';

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return ApiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors,
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.error(res, {
      message: 'Validation failed',
      statusCode: 400,
      errors: formattedErrors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, {
      message: 'Invalid authorization token',
      statusCode: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, {
      message: 'Authorization token expired',
      statusCode: 401,
    });
  }

  return ApiResponse.error(res, {
    message: err.message || 'Internal Server Error',
    statusCode: 500,
  });
}
