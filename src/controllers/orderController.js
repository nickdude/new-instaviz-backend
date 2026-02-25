const asyncHandler = require("../middleware/asyncHandler");
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderStats
} = require("../services/orderService");
const {
  notifyUserOrderStatusChange,
  notifyAdminOrderStatusChange,
  notifyUserOrderCreated
} = require("../services/notificationService");

// Create new order
const create = asyncHandler(async (req, res) => {
  const { planId, cardType, quantity, customization, shippingAddress, totalAmount, notes } = req.body;

  // Validate required fields
  if (!planId) {
    return res.status(400).json({
      success: false,
      message: "Plan ID is required"
    });
  }

  if (!cardType) {
    return res.status(400).json({
      success: false,
      message: "Card type is required"
    });
  }

  // Validate card type
  const validCardTypes = ["digital", "physical", "NFC"];
  if (!validCardTypes.includes(cardType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid card type. Must be one of: ${validCardTypes.join(", ")}`
    });
  }

  if (!quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be at least 1"
    });
  }

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Total amount must be greater than 0"
    });
  }

  const order = await createOrder({
    userId: req.user._id,
    planId,
    cardType,
    quantity,
    customization,
    shippingAddress,
    totalAmount,
    notes
  });

  // Send confirmation email (async, don't wait)
  notifyUserOrderCreated(order._id).catch(err => 
    console.error("Failed to send order confirmation:", err)
  );

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order
  });
});

// Get all orders
const getAll = asyncHandler(async (req, res) => {
  const { status, cardType, startDate, endDate } = req.query;
  const isAdmin = req.user.userType === "admin";

  const filters = {};
  if (status) filters.status = status;
  if (cardType) filters.cardType = cardType;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  // For non-admin users, only return their own orders
  if (!isAdmin) {
    filters.userId = req.user._id;
  }

  const orders = await getAllOrders(filters);

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// Get single order
const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await getOrderById(id);

  // Authorization check - user can only view their own orders
  if (order.userId._id.toString() !== req.user._id.toString() && req.user.userType !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to view this order"
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// Update order
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customization, shippingAddress, totalAmount, notes, status } = req.body;

  // Get order first to check authorization
  const order = await getOrderById(id);

  if (order.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only edit your own orders"
    });
  }

  const updateData = {
    customization,
    shippingAddress,
    totalAmount,
    notes
  };

  // If status is being updated, add it and update history
  if (status && status !== order.status) {
    updateData.status = status;
  }

  const updatedOrder = await updateOrder(id, updateData);

  res.json({
    success: true,
    message: "Order updated successfully",
    data: updatedOrder
  });
});

// Delete order
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.userType === "admin";

  const order = await getOrderById(id);

  // Authorization check - user can only delete their own orders, or admin can delete any
  if (order.userId._id.toString() !== req.user._id.toString() && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own orders"
    });
  }

  await deleteOrder(id);

  res.json({
    success: true,
    message: "Order deleted successfully"
  });
});

// Update order status (admin only)
const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required"
    });
  }

  const order = await updateOrderStatus(id, status, adminNotes);

  // Send notifications (async, don't wait)
  notifyUserOrderStatusChange(id, status, adminNotes).catch(err => 
    console.error("Failed to send user notification:", err)
  );
  notifyAdminOrderStatusChange(id, status, req.user.name).catch(err => 
    console.error("Failed to send admin notification:", err)
  );

  res.json({
    success: true,
    message: "Order status updated successfully",
    data: order
  });
});

// Get order statistics
const getStats = asyncHandler(async (req, res) => {
  const isAdmin = req.user.userType === "admin";

  const filters = isAdmin ? {} : { userId: req.user._id };
  const stats = await getOrderStats(filters);

  res.json({
    success: true,
    data: stats
  });
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  updateStatus,
  getStats
};
