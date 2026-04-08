const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be greater than or equal to 0"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be in smallest currency unit (integer)",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      default: "OTHER",
      enum: {
        values: ["FOOD", "TRAVEL", "TRANSPORT", "ENTERTAINMENT", "SHOPPING", "UTILITIES", "RENT", "OTHER"],
        message: "Invalid category",
      },
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ category: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
