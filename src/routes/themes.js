const express = require("express");
const router = express.Router();
const themeController = require("../controllers/themeController");
const { authMiddleware } = require("../middleware/authMiddleware");

// User routes (protected)
router.get("/", authMiddleware, themeController.getThemesByTemplateId);

module.exports = router;
