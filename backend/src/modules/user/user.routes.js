const express = require("express");
const {
  getCurrentUserController,
  updateBudgetController,
} = require("./user.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/me", protect, getCurrentUserController);
router.patch("/budget", protect, updateBudgetController);

module.exports = router;
