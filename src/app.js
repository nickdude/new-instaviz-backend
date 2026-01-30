const express = require("express");
const cors = require("cors");

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const planRoutes = require("./routes/plans");
const subscriptionRoutes = require("./routes/subscriptions");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
