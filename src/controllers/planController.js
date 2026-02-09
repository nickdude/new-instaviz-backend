const asyncHandler = require("../middleware/asyncHandler");
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  togglePlanStatus
} = require("../services/planService");

// @desc    Create new plan
// @route   POST /api/plans
// @access  Private/Admin
const create = asyncHandler(async (req, res) => {
  const { title, description, durationDays, price, cardTypes, features } = req.body;

  // Validation
  if (!title || !description || !durationDays || !price || !cardTypes || !features) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  if (!Array.isArray(cardTypes) || cardTypes.length === 0) {
    res.status(400);
    throw new Error("Card types must be a non-empty array. Choose from: physical, digital, NFC");
  }

  const validCardTypes = ["physical", "digital", "NFC"];
  const invalidTypes = cardTypes.filter(type => !validCardTypes.includes(type));
  if (invalidTypes.length > 0) {
    res.status(400);
    throw new Error(`Invalid card types: ${invalidTypes.join(", ")}. Valid options: physical, digital, NFC`);
  }

  if (!Array.isArray(features) || features.length === 0) {
    res.status(400);
    throw new Error("Features must be a non-empty array");
  }

  const plan = await createPlan({ title, description, durationDays, price, cardTypes, features });

  res.status(201).json({
    success: true,
    message: "Plan created successfully",
    data: plan
  });
});

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getAll = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  
  const plans = await getAllPlans({ 
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined 
  });

  res.json({
    success: true,
    count: plans.length,
    data: plans
  });
});

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Public
const getOne = asyncHandler(async (req, res) => {
  const plan = await getPlanById(req.params.id);

  res.json({
    success: true,
    data: plan
  });
});

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const update = asyncHandler(async (req, res) => {
  const { title, description, durationDays, price, cardTypes, features, isActive } = req.body;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (durationDays !== undefined) updateData.durationDays = durationDays;
  if (price !== undefined) updateData.price = price;
  
  if (cardTypes !== undefined) {
    if (!Array.isArray(cardTypes) || cardTypes.length === 0) {
      res.status(400);
      throw new Error("Card types must be a non-empty array. Choose from: physical, digital, NFC");
    }
    const validCardTypes = ["physical", "digital", "NFC"];
    const invalidTypes = cardTypes.filter(type => !validCardTypes.includes(type));
    if (invalidTypes.length > 0) {
      res.status(400);
      throw new Error(`Invalid card types: ${invalidTypes.join(", ")}. Valid options: physical, digital, NFC`);
    }
    updateData.cardTypes = cardTypes;
  }
  
  if (features !== undefined) {
    if (!Array.isArray(features) || features.length === 0) {
      res.status(400);
      throw new Error("Features must be a non-empty array");
    }
    updateData.features = features;
  }
  if (isActive !== undefined) updateData.isActive = isActive;

  const plan = await updatePlan(req.params.id, updateData);

  res.json({
    success: true,
    message: "Plan updated successfully",
    data: plan
  });
});

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const remove = asyncHandler(async (req, res) => {
  const result = await deletePlan(req.params.id);

  res.json({
    success: true,
    message: result.message
  });
});

// @desc    Toggle plan active status
// @route   PATCH /api/plans/:id/toggle
// @access  Private/Admin
const toggleStatus = asyncHandler(async (req, res) => {
  const plan = await togglePlanStatus(req.params.id);

  res.json({
    success: true,
    message: "Plan status updated successfully",
    data: plan
  });
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  toggleStatus
};
