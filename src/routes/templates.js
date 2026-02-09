const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");
const { authMiddleware } = require("../middleware/authMiddleware");

// User routes (protected)
router.get("/", authMiddleware, templateController.getTemplates);

module.exports = router;
