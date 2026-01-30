const asyncHandler = require("../middleware/asyncHandler");
const {
  initiatePurchase,
  verifyAndActivate,
  getActiveSubscription,
  getUserSubscriptions,
  cancelSubscription,
  getAllSubscriptions
} = require("../services/subscriptionService");

// @desc    Initiate plan purchase
// @route   POST /api/subscriptions/purchase
// @access  Private (User)
const purchase = asyncHandler(async (req, res) => {
  const { planId, currency } = req.body;

  // Validation
  if (!planId || !currency) {
    res.status(400);
    throw new Error("Please provide planId and currency");
  }

  const result = await initiatePurchase(req.user.id, planId, currency);

  res.status(201).json({
    success: true,
    message: "Purchase initiated successfully",
    data: {
      ...result,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    }
  });
});

// @desc    Verify payment and activate subscription
// @route   POST /api/subscriptions/verify
// @access  Private (User)
const verify = asyncHandler(async (req, res) => {
  const { subscriptionId, orderId, paymentId, signature } = req.body;

  // Validation
  if (!subscriptionId || !orderId || !paymentId || !signature) {
    res.status(400);
    throw new Error("Please provide subscriptionId, orderId, paymentId, and signature");
  }

  const subscription = await verifyAndActivate(subscriptionId, {
    orderId,
    paymentId,
    signature
  });

  res.json({
    success: true,
    message: "Payment verified and subscription activated",
    data: subscription
  });
});

// @desc    Get user's active subscription
// @route   GET /api/subscriptions/active
// @access  Private (User)
const getActive = asyncHandler(async (req, res) => {
  const subscription = await getActiveSubscription(req.user.id);

  res.json({
    success: true,
    data: subscription
  });
});

// @desc    Get user's subscription history
// @route   GET /api/subscriptions/history
// @access  Private (User)
const getHistory = asyncHandler(async (req, res) => {
  const subscriptions = await getUserSubscriptions(req.user.id);

  res.json({
    success: true,
    count: subscriptions.length,
    data: subscriptions
  });
});

// @desc    Cancel subscription
// @route   POST /api/subscriptions/:id/cancel
// @access  Private (User)
const cancel = asyncHandler(async (req, res) => {
  const subscription = await cancelSubscription(req.params.id, req.user.id);

  res.json({
    success: true,
    message: "Subscription cancelled successfully",
    data: subscription
  });
});

// @desc    Get all subscriptions (Admin)
// @route   GET /api/subscriptions/admin/all
// @access  Private (Admin)
const getAllAdmin = asyncHandler(async (req, res) => {
  const { status, userId } = req.query;

  const subscriptions = await getAllSubscriptions({ status, userId });

  res.json({
    success: true,
    count: subscriptions.length,
    data: subscriptions
  });
});

module.exports = {
  purchase,
  verify,
  getActive,
  getHistory,
  cancel,
  getAllAdmin
};
