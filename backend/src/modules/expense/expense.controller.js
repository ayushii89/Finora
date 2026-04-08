const { createExpense, getUserExpenses, getExpenseSummary, deleteExpense } = require("./expense.service");
const ApiResponse = require("../../utils/ApiResponse");
const catchAsync = require("../../utils/catchAsync");

const createExpenseController = catchAsync(async (req, res) => {
  const userId = req.userId || req.user.id || req.user._id;
  const result = await createExpense(userId, req.body);

  return ApiResponse.success(
    res,
    201,
    "Expense created successfully",
    result
  );
});

const getUserExpensesController = catchAsync(async (req, res) => {
  const userId = req.userId || req.user.id || req.user._id;
  const { page, limit, category } = req.query;
  const result = await getUserExpenses(userId, { page, limit, category });

  return ApiResponse.success(
    res,
    200,
    "Expenses fetched successfully",
    result
  );
});

const getExpenseSummaryController = catchAsync(async (req, res) => {
  const userId = req.userId || req.user.id || req.user._id;
  const { month, year } = req.query;
  const result = await getExpenseSummary(userId, month, year);

  return ApiResponse.success(
    res,
    200,
    "Expense summary fetched successfully",
    result
  );
});

const deleteExpenseController = catchAsync(async (req, res) => {
  const userId = req.userId || req.user.id || req.user._id;
  const expenseId = req.params.id;
  await deleteExpense(userId, expenseId);

  return ApiResponse.success(
    res,
    200,
    "Expense deleted successfully",
    null
  );
});

module.exports = {
  createExpenseController,
  getUserExpensesController,
  getExpenseSummaryController,
  deleteExpenseController,
};
