const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const profileUploadFields = upload.fields([
	{ name: "photo", maxCount: 1 },
	{ name: "companyLogo", maxCount: 1 },
	{ name: "resumeFile", maxCount: 1 },
	{ name: "productImages", maxCount: 3 },
	{ name: "productPdfs", maxCount: 3 }
]);

// Admin routes
router.get("/admin/all", authMiddleware, adminOnly, profileController.getAllProfiles);

// User routes (protected)
router.post("/", authMiddleware, profileUploadFields, profileController.createProfile);
router.get("/", authMiddleware, profileController.getUserProfiles);
router.get("/:id", authMiddleware, profileController.getProfileById);
router.put("/:id", authMiddleware, profileUploadFields, profileController.updateProfile);
router.delete("/:id", authMiddleware, profileController.deleteProfile);
router.patch("/:id/toggle", authMiddleware, profileController.toggleProfileStatus);

module.exports = router;
