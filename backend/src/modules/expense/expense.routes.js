const express = require("express");
const {
  createExpenseController,
  getUserExpensesController,
  getExpenseSummaryController,
  deleteExpenseController,
} = require("./expense.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, createExpenseController);
router.get("/", protect, getUserExpensesController);
router.get("/summary", protect, getExpenseSummaryController);
router.delete("/:id", protect, deleteExpenseController);

module.exports = router;
