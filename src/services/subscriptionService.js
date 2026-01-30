const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const { createOrder } = require("../config/razorpay");

const currencyMap = {
  rupees: "INR",
  dollar: "USD"
};

// Initiate plan purchase
const initiatePurchase = async (userId, planId, currency) => {
  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Validate plan
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.isActive) {
    throw new Error("Plan is not available");
  }

  // Validate currency
  if (!["rupees", "dollar"].includes(currency)) {
    throw new Error("Invalid currency. Must be 'rupees' or 'dollar'");
  }

  // Get amount based on currency
  const amount = plan.price[currency];
  const amountInSubunits = Math.round(Number(amount) * 100);
  const currencyCode = currencyMap[currency];
  const receipt = `rcpt_${uuidv4().replace(/-/g, "").substring(0, 14)}`;

  // Create Razorpay order
  const razorpayOrder = await createOrder({
    amount: amountInSubunits,
    currency: currencyCode,
    receipt,
    notes: {
      userId: String(userId),
      planId: String(planId)
    }
  });

  // Create subscription with pending status
  const subscription = await Subscription.create({
    userId,
    planId,
    status: "pending",
    paymentDetails: {
      orderId: razorpayOrder.id,
      currency,
      amount
    }
  });

  return {
    subscription,
    razorpayOrder,
    plan: {
      title: plan.title,
      description: plan.description,
      durationDays: plan.durationDays,
      features: plan.features
    }
  };
};

// Verify payment and activate subscription
const verifyAndActivate = async (subscriptionId, paymentData) => {
  const subscription = await Subscription.findById(subscriptionId).populate("planId");
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (subscription.status !== "pending") {
    throw new Error("Subscription is not in pending state");
  }

  if (!paymentData.orderId || !paymentData.paymentId || !paymentData.signature) {
    throw new Error("Payment verification data is incomplete");
  }

  if (subscription.paymentDetails.orderId !== paymentData.orderId) {
    throw new Error("Order ID does not match subscription");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${paymentData.orderId}|${paymentData.paymentId}`)
    .digest("hex");

  if (expectedSignature !== paymentData.signature) {
    throw new Error("Payment verification failed");
  }

  // Calculate subscription period based on plan's duration
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + subscription.planId.durationDays);

  // Update subscription
  subscription.status = "active";
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  subscription.paymentDetails.paymentId = paymentData.paymentId;
  subscription.paymentDetails.signature = paymentData.signature;

  await subscription.save();

  return subscription;
};

// Get user's active subscription
const getActiveSubscription = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
    endDate: { $gte: new Date() }
  })
    .populate("planId")
    .sort({ createdAt: -1 });

  return subscription;
};

// Get user's subscription history
const getUserSubscriptions = async (userId) => {
  const subscriptions = await Subscription.find({ userId })
    .populate("planId")
    .sort({ createdAt: -1 });

  return subscriptions;
};

// Cancel subscription
const cancelSubscription = async (subscriptionId, userId) => {
  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    userId
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (subscription.status !== "active") {
    throw new Error("Only active subscriptions can be cancelled");
  }

  subscription.status = "cancelled";
  await subscription.save();

  return subscription;
};

// Admin: Get all subscriptions
const getAllSubscriptions = async (filters = {}) => {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.userId) {
    query.userId = filters.userId;
  }

  const subscriptions = await Subscription.find(query)
    .populate("userId", "name email")
    .populate("planId")
    .sort({ createdAt: -1 });

  return subscriptions;
};

module.exports = {
  initiatePurchase,
  verifyAndActivate,
  getActiveSubscription,
  getUserSubscriptions,
  cancelSubscription,
  getAllSubscriptions
};
