const asyncHandler = require("../middleware/asyncHandler");
const templateService = require("../services/templateService");

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private (User)
const getTemplates = asyncHandler(async (req, res) => {
  const response = await templateService.getTemplates();

  // Extract templates from the response
  const templates = response.data || response.templates || [];

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates,
  });
});

module.exports = {
  getTemplates,
};
