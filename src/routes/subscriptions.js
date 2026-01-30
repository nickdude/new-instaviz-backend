const express = require("express");
const router = express.Router();
const {
  purchase,
  verify,
  getActive,
  getHistory,
  cancel,
  getAllAdmin
} = require("../controllers/subscriptionController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// User routes (requires authentication)
router.post("/purchase", authMiddleware, purchase);
router.post("/verify", authMiddleware, verify);
router.get("/active", authMiddleware, getActive);
router.get("/history", authMiddleware, getHistory);
router.post("/:id/cancel", authMiddleware, cancel);

// Admin routes
router.get("/admin/all", authMiddleware, adminOnly, getAllAdmin);

module.exports = router;
