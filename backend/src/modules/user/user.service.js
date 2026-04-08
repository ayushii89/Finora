const User = require("../auth/auth.model");
const ApiError = require("../../utils/ApiError");

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  return user;
};

const updateBudget = async (userId, monthlyBudget) => {
  if (monthlyBudget === undefined || monthlyBudget === null || monthlyBudget === "") {
    throw new ApiError(400, "Monthly budget is required", "VALIDATION_ERROR");
  }

  const parsedBudget = Number(monthlyBudget);

  if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
    throw new ApiError(400, "Monthly budget must be greater than or equal to 0", "VALIDATION_ERROR");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { monthlyBudget: parsedBudget },
    { new: true, runValidators: true }
  )
    .select("-password")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  return user;
};

module.exports = {
  getCurrentUser,
  updateBudget,
};
