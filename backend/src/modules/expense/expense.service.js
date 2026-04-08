const Expense = require("./expense.model");
const User = require("../auth/auth.model");
const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");

const createExpense = async (userId, data) => {
  const payload = { ...data };
  delete payload.user;

  const { amount } = payload;

  if (amount === undefined || amount === null) {
    throw new ApiError(400, "Amount is required", "VALIDATION_ERROR");
  }

  if (amount < 0) {
    throw new ApiError(400, "Amount must be greater than or equal to 0", "VALIDATION_ERROR");
  }

  if (amount > 1000000000) {
    throw new ApiError(400, "Amount too large", "VALIDATION_ERROR");
  }

  if (!Number.isInteger(amount)) {
    throw new ApiError(400, "Amount must be in smallest currency unit (integer)", "VALIDATION_ERROR");
  }

  if (!payload.category) {
    payload.category = "OTHER";
  }

  payload.category = payload.category.toUpperCase();

  if (typeof payload.notes === "string") {
    payload.notes = payload.notes.trim();

    if (!payload.notes) {
      delete payload.notes;
    }
  }

  const expense = await Expense.create({
    ...payload,
    user: userId,
  });

  return expense.toObject();
};

const getUserExpenses = async (
  userId,
  { page = 1, limit = 10, category } = {}
) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Number(limit) || 10);

  const filter = { user: userId };

  if (category) {
    filter.category = String(category).toUpperCase();
  }

  const skip = (parsedPage - 1) * parsedLimit;

  const expenses = await Expense.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parsedLimit);

  const total = await Expense.countDocuments(filter);

  return {
    expenses: expenses.map(exp => exp.toObject()),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};

const getExpenseSummary = async (userId, month, year) => {
  if (month === undefined || month === null || year === undefined || year === null) {
    throw new ApiError(400, "Month and year are required", "VALIDATION_ERROR");
  }

  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (numericMonth < 1 || numericMonth > 12) {
    throw new ApiError(400, "Month must be between 1 and 12", "VALIDATION_ERROR");
  }

  const startDate = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
  const endDate = new Date(Date.UTC(numericYear, numericMonth, 1));
  const matchFilter = {
    user: new mongoose.Types.ObjectId(userId),
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  const result = await Expense.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        total: [
          {
            $group: {
              _id: null,
              totalExpenses: { $sum: "$amount" },
            },
          },
        ],
        byCategory: [
          {
            $group: {
              _id: "$category",
              total: { $sum: "$amount" },
            },
          },
        ],
        weeklyTrend: [
          {
            $addFields: {
              week: { $week: "$date" },
            },
          },
          {
            $group: {
              _id: "$week",
              total: { $sum: "$amount" },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ],
      },
    },
  ]);

  const totalExpenses = result[0]?.total?.[0]?.totalExpenses || 0;

  const rawCategory = result[0]?.byCategory || [];
  const byCategory = rawCategory.map((item) => ({
    category: item._id,
    total: item.total,
  }));

  const rawWeekly = result[0]?.weeklyTrend || [];
  const weeklyTrend = rawWeekly.map((item) => ({
    week: item._id,
    total: item.total,
  }));

  const user = await User.findById(userId);
  const monthlyBudget = user?.monthlyBudget || 0;
  const remaining = monthlyBudget - totalExpenses;

  let status = "SAFE";

  if (remaining < 0) {
    status = "OVERSPENT";
  } else if (remaining < monthlyBudget * 0.2) {
    status = "WARNING";
  }

  return {
    totalExpenses,
    monthlyBudget,
    remaining,
    status,
    byCategory,
    weeklyTrend,
  };
};

const deleteExpense = async (userId, expenseId) => {
  if (!expenseId) {
    throw new ApiError(400, "Expense ID is required", "VALIDATION_ERROR");
  }

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, "Invalid expense ID", "VALIDATION_ERROR");
  }

  const existingExpense = await Expense.findById(expenseId).select("user");

  if (!existingExpense) {
    throw new ApiError(404, "Expense not found", "NOT_FOUND");
  }

  if (String(existingExpense.user) !== String(userId)) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  const expense = await Expense.findOneAndDelete({
    _id: expenseId,
    user: userId,
  });

  if (!expense) {
    throw new ApiError(404, "Expense not found", "NOT_FOUND");
  }

  return true;
};

module.exports = {
  createExpense,
  getUserExpenses,
  getExpenseSummary,
  deleteExpense,
};
