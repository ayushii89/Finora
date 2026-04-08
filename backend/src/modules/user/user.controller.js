const { getCurrentUser, updateBudget } = require("./user.service");
const ApiResponse = require("../../utils/ApiResponse");
const catchAsync = require("../../utils/catchAsync");

const getCurrentUserController = catchAsync(async (req, res) => {
  const userId = req.userId || req.user.id || req.user._id;
  const result = await getCurrentUser(userId);

  return ApiResponse.success(
    res,
    200,
    "Current user fetched successfully",
    result
  );
});

const updateBudgetController = catchAsync(async (req, res) => {
  const userId = req.userId || req.user.id || req.user._id;
  const { monthlyBudget } = req.body;
  const result = await updateBudget(userId, monthlyBudget);

  return ApiResponse.success(
    res,
    200,
    "Budget updated successfully",
    result
  );
});

module.exports = {
  getCurrentUserController,
  updateBudgetController,
};
