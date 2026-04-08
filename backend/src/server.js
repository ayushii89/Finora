const app = require("./app");
const connectDB = require("./config/db");
const { PORT } = require("./config/env");

console.log("[startup] boot", {
	nodeVersion: process.version,
	port: PORT,
	nodeEnv: process.env.NODE_ENV || "development",
});

const start = async () => {
	try {
		await connectDB();

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Startup error", {
			name: error.name,
			message: error.message,
			stack: error.stack,
		});
		process.exit(1);
	}
};

process.on("unhandledRejection", (error) => {
	console.error("Unhandled Rejection:", error);
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	process.exit(1);
});

start();
