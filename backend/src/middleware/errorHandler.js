const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return ApiResponse.error(
      res,
      err.statusCode,
      err.message,
      err.errorCode,
      err.details
    );
  }

  if (err && err.name === "ValidationError") {
    const validationDetails = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    return ApiResponse.error(
      res,
      400,
      "Validation failed",
      "VALIDATION_ERROR",
      validationDetails
    );
  }

  if (err && err.code === 11000) {
    const duplicateFields = Object.keys(err.keyValue || {});
    const message =
      duplicateFields.length > 0
        ? `Duplicate value for field(s): ${duplicateFields.join(", ")}`
        : "Duplicate key error";

    return ApiResponse.error(
      res,
      409,
      message,
      "CONFLICT",
      err.keyValue ? [err.keyValue] : []
    );
  }

  console.error(err);

  return ApiResponse.error(
    res,
    500,
    "Internal Server Error",
    "INTERNAL_ERROR",
    []
  );
};

module.exports = errorHandler;