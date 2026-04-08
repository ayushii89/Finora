const { signup, login } = require("./auth.service");
const ApiResponse = require("../../utils/ApiResponse");
const catchAsync = require("../../utils/catchAsync");

const signupController = catchAsync(async (req, res) => {
  const result = await signup(req.body);

  return ApiResponse.success(
    res,
    201,
    "Account created successfully",
    result
  );
});

const loginController = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);

  return ApiResponse.success(
    res,
    200,
    "Login successful",
    result
  );
});

module.exports = {
  signupController,
  loginController,
};
