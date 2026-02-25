const express = require("express");
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  updateStatus,
  update,
  remove,
  getStats
} = require("../controllers/orderController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// User routes - authenticated users can manage their orders
router.post("/", authMiddleware, create);
router.get("/", authMiddleware, getAll);
router.get("/stats/summary", authMiddleware, getStats);
router.get("/:id", authMiddleware, getOne);
router.put("/:id", authMiddleware, update);
router.delete("/:id", authMiddleware, remove);

// Admin routes - only admins can update order status
router.patch("/:id/status", authMiddleware, adminOnly, updateStatus);

module.exports = router;
