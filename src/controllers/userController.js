const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

// Helper function to get user details with subscription
const getUserDetails = async (userId) => {
  const user = await User.findById(userId).select("-password -resetToken -resetExpires -verifyToken");
  
  if (!user) {
    return null;
  }

  // Get user's subscription
  const subscription = await Subscription.findOne({ userId: user._id })
    .populate("planId", "title price");

  // Get plan details if subscription exists
  let planName = "No Plan";
  let planPrice = 0;
  let status = "inactive";
  let planExpiry = null;

  if (subscription) {
    planName = subscription.planId?.title || "Unknown Plan";
    planPrice = subscription.paymentDetails?.amount || 0;
    status = subscription.status || "pending";
    planExpiry = subscription.endDate ? subscription.endDate.toISOString().split('T')[0] : null;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "N/A",
    plan: planName,
    status: status === "active" ? "active" : "inactive",
    revenue: planPrice,
    joinDate: user.createdAt.toISOString().split('T')[0],
    planExpiry: planExpiry,
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };
};

// @desc    Get all users with details
// @route   GET /api/users
// @access  Private/Admin
const getAll = asyncHandler(async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find({ userType: "user" }).select("-password -resetToken -resetExpires -verifyToken");

    // Fetch subscriptions and calculate details for each user
    const usersWithDetails = await Promise.all(
      users.map(user => getUserDetails(user._id))
    );

    res.json({
      success: true,
      count: usersWithDetails.length,
      data: usersWithDetails
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users"
    });
  }
});

// @desc    Get single user details
// @route   GET /api/users/:id
// @access  Private/Admin
const getOne = asyncHandler(async (req, res) => {
  try {
    const userDetails = await getUserDetails(req.params.id);

    if (!userDetails) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      data: userDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const update = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validation
    if (!name && !email && !phone) {
      res.status(400);
      throw new Error("Please provide at least one field to update");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(email && { email }), ...(phone && { phone }) },
      { new: true, runValidators: true }
    ).select("-password -resetToken -resetExpires -verifyToken");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const remove = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Also delete user's subscriptions
    await Subscription.deleteMany({ userId: req.params.id });

    res.json({
      success: true,
      message: "User deleted successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  getAll,
  getOne,
  update,
  remove
};
