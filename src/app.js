const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");

const envOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((item) => normalizeOrigin(item.trim()))
  .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://instaviz.me",
  "https://www.instaviz.me"
];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server and tools with no Origin header
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Import routes
const authRoutes = require("./routes/auth");
const planRoutes = require("./routes/plans");
const subscriptionRoutes = require("./routes/subscriptions");
const profileRoutes = require("./routes/profiles");
const templateRoutes = require("./routes/templates");
const themeRoutes = require("./routes/themes");
const cardRoutes = require("./routes/cards");
const userRoutes = require("./routes/users");
const orderRoutes = require("./routes/orders");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/cards", cardRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
