const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const expenseRoutes = require("./modules/expense/expense.routes");
const userRoutes = require("./modules/user/user.routes");
const { protect } = require("./middleware/auth.middleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ✅ FIXED CORS
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sierra API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/user", userRoutes);

// Protected test route
app.get("/api/test", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;

