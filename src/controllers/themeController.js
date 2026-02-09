const asyncHandler = require("../middleware/asyncHandler");
const themeService = require("../services/themeService");

// @desc    Get themes by template ID
// @route   GET /api/themes?template_id=xxx
// @access  Private (User)
const getThemesByTemplateId = asyncHandler(async (req, res) => {
  const { template_id } = req.query;

  if (!template_id) {
    return res.status(400).json({
      success: false,
      message: "template_id is required",
    });
  }

  const response = await themeService.getThemesByTemplateId(template_id);

  // Extract themes from the response
  const themes = response.data || response.themes || [];

  res.status(200).json({
    success: true,
    count: themes.length,
    data: themes,
  });
});

module.exports = {
  getThemesByTemplateId,
};
