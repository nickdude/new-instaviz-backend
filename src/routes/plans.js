const express = require("express");
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  toggleStatus
} = require("../controllers/planController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAll);
router.get("/:id", getOne);

// Admin only routes
router.post("/", authMiddleware, adminOnly, create);
router.put("/:id", authMiddleware, adminOnly, update);
router.delete("/:id", authMiddleware, adminOnly, remove);
router.patch("/:id/toggle", authMiddleware, adminOnly, toggleStatus);

module.exports = router;
