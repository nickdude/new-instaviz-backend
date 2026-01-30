const Plan = require("../models/Plan");

// Create plan
const createPlan = async ({ title, description, durationDays, price, features }) => {
  // Validate price structure
  if (!price?.rupees || !price?.dollar) {
    throw new Error("Please provide price in both rupees and dollars");
  }

  // Validate duration
  if (!durationDays || durationDays < 1) {
    throw new Error("Please provide valid duration in days (minimum 1 day)");
  }

  const plan = await Plan.create({
    title,
    description,
    durationDays,
    price,
    features
  });

  return plan;
};

// Get all plans
const getAllPlans = async ({ isActive } = {}) => {
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  const plans = await Plan.find(filter).sort({ createdAt: -1 });
  return plans;
};

// Get single plan by ID
const getPlanById = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }
  return plan;
};

// Update plan
const updatePlan = async (planId, updateData) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  // Validate price if being updated
  if (updateData.price) {
    if (!updateData.price.rupees || !updateData.price.dollar) {
      throw new Error("Please provide price in both rupees and dollars");
    }
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    plan[key] = updateData[key];
  });

  await plan.save();
  return plan;
};

// Delete plan
const deletePlan = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  await plan.deleteOne();
  return { message: "Plan deleted successfully" };
};

// Toggle plan active status
const togglePlanStatus = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  plan.isActive = !plan.isActive;
  await plan.save();
  return plan;
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  togglePlanStatus
};
