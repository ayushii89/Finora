class ApiError extends Error {
  constructor(
    statusCode = 500,
    message = "Internal Server Error",
    errorCode = "INTERNAL_ERROR",
    details = [],
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
