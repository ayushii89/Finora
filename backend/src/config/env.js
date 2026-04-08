require("dotenv").config({ quiet: true });

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("[startup] env check", {
  nodeVersion: process.version,
  nodeEnv: NODE_ENV,
  port: PORT,
  hasMongoUri: Boolean(MONGO_URI),
  hasJwtSecret: Boolean(JWT_SECRET),
  hasJwtExpiresIn: Boolean(JWT_EXPIRES_IN),
  runningOnRender: Boolean(process.env.RENDER),
});

if (!MONGO_URI) {
  throw new Error("MONGO_URI is required in environment variables (Render dashboard -> Environment)");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in environment variables (Render dashboard -> Environment)");
}

module.exports = {
  PORT,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV,
};