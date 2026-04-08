class ApiResponse {
  static success(res, statusCode = 200, message = "Success", data = null, meta = null) {
    const response = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static error(
    res,
    statusCode = 500,
    message = "Internal Server Error",
    errorCode = "INTERNAL_SERVER_ERROR",
    details = []
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        code: errorCode,
        details,
      },
    });
  }
}

module.exports = ApiResponse;
