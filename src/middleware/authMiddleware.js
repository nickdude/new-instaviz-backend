const { verifyToken } = require("../utils/token");
const User = require("../models/User");

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Verify JWT and attach user to request
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401);
      throw new Error("No token provided");
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    next(error);
  }
};

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user?.userType !== "admin") {
    res.status(403);
    throw new Error("Access denied. Admin only.");
  }
  next();
};

// Check if user is regular user
const userOnly = (req, res, next) => {
  if (req.user?.userType !== "user") {
    res.status(403);
    throw new Error("Access denied. User only.");
  }
  next();
};

// Allow first admin creation without auth, protect subsequent ones
const firstAdminOrAuth = asyncHandler(async (req, res, next) => {
  // Check if any admin exists
  const admin = await User.findOne({ userType: "admin" });
  
  if (admin) {
    // Admin exists, require authentication
    authMiddleware(req, res, () => {
      adminOnly(req, res, next);
    });
  } else {
    // No admin exists, allow first admin creation
    next();
  }
});

module.exports = { authMiddleware, adminOnly, userOnly, firstAdminOrAuth };
