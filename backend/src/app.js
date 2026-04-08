const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");
const expenseRoutes = require("./modules/expense/expense.routes");
const userRoutes = require("./modules/user/user.routes");
const { protect } = require("./middleware/auth.middleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Sierra API is running",
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/user", userRoutes);

app.get("/api/test", protect, (req, res) => {
	res.status(200).json({
		success: true,
		message: "Protected route accessed",
		user: req.user,
	});
});

app.use(errorHandler);

module.exports = app;

