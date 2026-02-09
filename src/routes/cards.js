const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, cardController.createCard);
router.get("/", authMiddleware, cardController.getCards);
router.get("/:id", authMiddleware, cardController.getCardById);
router.put("/:id", authMiddleware, cardController.updateCard);

module.exports = router;
