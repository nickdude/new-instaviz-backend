const asyncHandler = require("../middleware/asyncHandler");
const cardService = require("../services/cardService");
const profileService = require("../services/profileService");
const Card = require("../models/Card");
const User = require("../models/User");

const extractSlug = (response) => {
  if (!response) return null;
  const data = response.data || {};
  const link = response.link || data.link || response.card_url || data.card_url || response.url || data.url || null;

  if (response.slug || data.slug) return response.slug || data.slug;
  if (!link || typeof link !== "string") return null;
  const parts = link.split("/dvc/");
  return parts.length > 1 ? parts[1] : link.split("/").pop();
};

// @desc    Create card for a profile using template and theme
// @route   POST /api/cards
// @access  Private (User)
const createCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { profileId, templateId, themeId } = req.body;

  if (!profileId || !templateId || !themeId) {
    return res.status(400).json({
      success: false,
      message: "profileId, templateId and themeId are required"
    });
  }

  const profile = await profileService.getProfileById(profileId, userId);
  const user = await User.findById(userId);

  try {
    const { data, payload } = await cardService.createExternalCard({
      templateId,
      themeId,
      profile,
      user
    });

    const card = await Card.create({
      userId,
      profileId,
      templateId,
      themeId,
      status: data?.status || "created",
      payload,
      response: data,
      slug: extractSlug(data)
    });

    res.status(201).json({
      success: true,
      data: card
    });
  } catch (error) {
    // Handle external API errors
    const statusCode = error.statusCode || 500;
    const errorResponse = {
      success: false,
      message: error.message,
      code: error.code
    };

    // Include validation details if present
    if (error.details) {
      errorResponse.details = error.details;
    }

    return res.status(statusCode).json(errorResponse);
  }
});

// @desc    Get all cards for user
// @route   GET /api/cards
// @access  Private (User)
const getCards = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cards = await Card.find({ userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: cards.length,
    data: cards
  });
});

// @desc    Get a card by ID
// @route   GET /api/cards/:id
// @access  Private (User)
const getCardById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const card = await Card.findOne({ _id: id, userId });
  if (!card) {
    return res.status(404).json({
      success: false,
      message: "Card not found"
    });
  }

  res.status(200).json({
    success: true,
    data: card
  });
});

// @desc    Update a card (regenerate with new template/theme/profile)
// @route   PUT /api/cards/:id
// @access  Private (User)
const updateCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { profileId, templateId, themeId } = req.body;

  const card = await Card.findOne({ _id: id, userId });
  if (!card) {
    return res.status(404).json({
      success: false,
      message: "Card not found"
    });
  }

  const finalProfileId = profileId || card.profileId;
  const finalTemplateId = templateId || card.templateId;
  const finalThemeId = themeId || card.themeId;

  const profile = await profileService.getProfileById(finalProfileId, userId);
  const user = await User.findById(userId);

  try {
    const { data, payload } = await cardService.updateExternalCard({
      templateId: finalTemplateId,
      themeId: finalThemeId,
      profile,
      user,
      existingCard: card
    });

    card.profileId = finalProfileId;
    card.templateId = finalTemplateId;
    card.themeId = finalThemeId;
    card.status = data?.status || "updated";
    card.payload = payload;
    card.response = data;
    card.slug = extractSlug(data) || card.slug;

    await card.save();

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    // Handle external API errors
    const statusCode = error.statusCode || 500;
    const errorResponse = {
      success: false,
      message: error.message,
      code: error.code
    };

    // Include validation details if present
    if (error.details) {
      errorResponse.details = error.details;
    }

    return res.status(statusCode).json(errorResponse);
  }
});

module.exports = {
  createCard,
  getCards,
  getCardById,
  updateCard
};
