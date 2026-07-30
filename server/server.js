require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("../database/db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { authLimiter } = require("./middleware/rateLimiter");

// Route imports
const authRoutes = require("./routes/authRoutes");
const journalRoutes = require("./routes/journalRoutes");
const timeTrackerRoutes = require("./routes/timeTrackerRoutes");
const studyRoutes = require("./routes/studyRoutes");
const islamicTrackerRoutes = require("./routes/islamicTrackerRoutes");
const calorieTrackerRoutes = require("./routes/calorieTrackerRoutes");
const fitnessTrackerRoutes = require("./routes/fitnessTrackerRoutes");
const habitRoutes = require("./routes/habitRoutes");
const financeTrackerRoutes = require("./routes/financeTrackerRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const validateEnv = () => {
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

validateEnv();

const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin
  ? { origin: corsOrigin.split(",").map((value) => value.trim()) }
  : { origin: true };

// Middleware
app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/time-tracker", timeTrackerRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/islamic", islamicTrackerRoutes);
app.use("/api/calories", calorieTrackerRoutes);
app.use("/api/fitness", fitnessTrackerRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/finance", financeTrackerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
