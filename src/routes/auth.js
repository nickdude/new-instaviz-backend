const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verify,
  forgot,
  reset,
  createAdminUser
} = require("../controllers/authController");
const { authMiddleware, adminOnly, firstAdminOrAuth } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/verify/:token", verify);
router.post("/forgot", forgot);
router.post("/reset/:token", reset);

// Admin routes (first admin can be created without auth, subsequent ones require admin auth)
router.post("/create-admin", firstAdminOrAuth, createAdminUser);

module.exports = router;
