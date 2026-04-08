const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../modules/auth/auth.model");
const { JWT_SECRET } = require("../config/env");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authorized", "UNAUTHORIZED");
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found", "UNAUTHORIZED");
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(401, "Not authorized", "UNAUTHORIZED"));
  }
};

module.exports = {
  protect,
};
