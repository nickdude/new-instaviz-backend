const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const planRoutes = require("./routes/plans");
const subscriptionRoutes = require("./routes/subscriptions");
const profileRoutes = require("./routes/profiles");
const templateRoutes = require("./routes/templates");
const themeRoutes = require("./routes/themes");
const cardRoutes = require("./routes/cards");
const userRoutes = require("./routes/users");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/cards", cardRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
