const User = require("./auth.model");
const jwt = require("jsonwebtoken");
const ApiError = require("../../utils/ApiError");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../../config/env");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const signup = async (data) => {
  if (!data.email) {
    throw new ApiError(400, "Email is required", "VALIDATION_ERROR");
  }

  data.email = data.email.toLowerCase();

  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new ApiError(409, "Email already registered", "CONFLICT");
  }

  const user = await User.create(data);
  const token = generateToken(user._id);

  const userData = user.toObject();
  delete userData.password;
  delete userData.__v;

  return {
    user: userData,
    token,
  };
};

const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials", "UNAUTHORIZED");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials", "UNAUTHORIZED");
  }

  const token = generateToken(user._id);

  const userData = user.toObject();
  delete userData.password;
  delete userData.__v;

  return {
    user: userData,
    token,
  };
};

module.exports = {
  signup,
  login,
  generateToken,
};
