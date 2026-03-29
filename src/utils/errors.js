/**
 * Clase de error personalizada para la aplicación
 * Todos los errores operacionales deben heredar de esta clase
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores de validación
 */
class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Errores de autenticación
 */
class AuthenticationError extends AppError {
  constructor(message = 'Autenticación requerida') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Errores de autorización
 */
class AuthorizationError extends AppError {
  constructor(message = 'No tienes permiso para acceder a este recurso') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * Errores de no encontrado
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso', identifier = null) {
    const message = identifier
      ? `${resource} con ID ${identifier} no encontrado`
      : `${resource} no encontrado`;
    super(message, 404, true);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/**
 * Errores de conflicto (duplicado, etc)
 */
class ConflictError extends AppError {
  constructor(message, field = null) {
    super(message, 409, true);
    this.name = 'ConflictError';
    this.field = field;
  }
}

/**
 * Errores de rate limit
 */
class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
};
