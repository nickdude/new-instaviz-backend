const asyncHandler = require("../middleware/asyncHandler");
const cardService = require("../services/cardService");
const profileService = require("../services/profileService");
const orderService = require("../services/orderService");
const Card = require("../models/Card");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

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

    // Get user's active subscription to find planId and card types
    const subscription = await Subscription.findOne({
      userId,
      status: "active"
    }).populate("planId");

    if (subscription && subscription.planId) {
      const plan = subscription.planId;
      
      // Create orders for each card type in the plan
      // Quantity defaults to 1 for each card type
      const cardTypesToCreate = plan.cardTypes || [];
      
      for (const cardType of cardTypesToCreate) {
        try {
          const order = await orderService.createOrder({
            userId,
            planId: plan._id,
            cardType,
            quantity: 1,
            customization: {
              name: profile.firstName || user.firstName || "Default",
              title: profile.title || "Card",
              description: profile.description || ""
            },
            shippingAddress: cardType !== "digital" ? {
              fullName: profile.firstName || user.firstName || "",
              email: user.email,
              phone: profile.phone || user.phone || "",
              addressLine1: profile.address?.addressLine1 || "",
              addressLine2: profile.address?.addressLine2 || "",
              city: profile.address?.city || "",
              state: profile.address?.state || "",
              zipCode: profile.address?.zipCode || "",
              country: profile.address?.country || ""
            } : null,
            totalAmount: plan.price.rupees || 0,
            notes: `Auto-created order from card creation`
          });

          // If digital card, extract and store the digital link
          if (cardType === "digital" && data) {
            const digitalLink = data.link || data.data?.link || data.card_url || data.data?.card_url || data.url || data.data?.url;
            const digitalSlug = data.slug || data.data?.slug || data.card_slug || data.data?.card_slug;
            
            if (digitalLink) {
              // Update order with digital link and set status to Link Created
              order.digitalLink = {
                url: digitalLink,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
                accessCount: 0
              };
              order.status = "Link Created";
              
              // Update history
              order.history.push({
                status: "Link Created",
                changedAt: new Date(),
                changedBy: "user",
                reason: "Digital link generated from card creation"
              });
              
              await order.save();
            }
          }
        } catch (orderError) {
          // Log the error but don't fail the entire card creation
          console.error(`Failed to create order for card type ${cardType}:`, orderError.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: card,
      message: "Card created successfully! Orders have been created."
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
