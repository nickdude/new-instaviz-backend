const express = require("express");
const router = express.Router();
const {
  getAll,
  getOne,
  update,
  remove
} = require("../controllers/userController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Admin only routes - viewing users requires admin access
router.get("/", authMiddleware, adminOnly, getAll);
router.get("/:id", authMiddleware, adminOnly, getOne);

// Admin only routes - modifying users requires admin access
router.put("/:id", authMiddleware, adminOnly, update);
router.delete("/:id", authMiddleware, adminOnly, remove);

module.exports = router;
