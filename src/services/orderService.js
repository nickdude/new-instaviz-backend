const Order = require("../models/Order");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

// Create new order
const createOrder = async ({ userId, planId, cardType, quantity, customization, shippingAddress, totalAmount, notes }) => {
  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Validate plan exists
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  // Validate card type is available in plan
  if (!plan.cardTypes.includes(cardType)) {
    throw new Error(`Card type '${cardType}' is not available in this plan`);
  }

  // Check if user has active subscription
  const subscription = await Subscription.findOne({
    userId,
    status: "active"
  });

  if (!subscription) {
    throw new Error("User does not have an active subscription. Please purchase a plan first.");
  }

  // Validate quantity
  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Validate total amount
  if (!totalAmount || totalAmount <= 0) {
    throw new Error("Total amount must be greater than 0");
  }

  const order = new Order({
    userId,
    planId,
    cardType,
    orderDetails: {
      quantity,
      customization: customization || {},
      totalAmount
    },
    shippingAddress: cardType !== "digital" ? shippingAddress : null,
    status: "Order Pending",
    wasSubscriptionActive: true,
    notes,
    // Initialize history with first status
    history: [
      {
        status: "Order Pending",
        changedAt: new Date(),
        changedBy: "user",
        reason: "Order created"
      }
    ]
  });

  await order.save();
  return order;
};

// Get all orders
const getAllOrders = async (filters = {}) => {
  const { userId, status, cardType, startDate, endDate } = filters;
  const query = {};

  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (cardType) query.cardType = cardType;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(query)
    .populate("userId", "name email phone")
    .populate("planId", "title price cardTypes")
    .sort({ createdAt: -1 });

  return orders;
};

// Get single order by ID
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("userId", "name email phone")
    .populate("planId", "title price cardTypes features description");

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

// Update order (for pending orders)
const updateOrder = async (orderId, updateData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // Only allow editing if order is still in "Order Pending" status
  if (order.status !== "Order Pending") {
    throw new Error(`Cannot edit order after it has been processed. Current status: ${order.status}`);
  }

  const { customization, shippingAddress, totalAmount, notes, status } = updateData;

  if (customization) {
    order.orderDetails.customization = { ...order.orderDetails.customization, ...customization };
  }

  if (shippingAddress && order.cardType !== "digital") {
    order.shippingAddress = shippingAddress;
  }

  if (totalAmount) {
    order.orderDetails.totalAmount = totalAmount;
  }

  if (notes) {
    order.notes = notes;
  }

  // Handle status update with history
  if (status && status !== order.status) {
    order.status = status;
    order.history.push({
      status: status,
      changedAt: new Date(),
      changedBy: 'user',
      reason: 'Delivery address provided',
      notes: shippingAddress ? 'Shipping address updated' : undefined
    });
  }

  await order.save();
  return order;
};

// Delete order (only pending orders)
const deleteOrder = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "Order Pending") {
    throw new Error("Cannot delete order. Only pending orders can be deleted.");
  }

  await Order.findByIdAndDelete(orderId);
  return { message: "Order deleted successfully" };
};

// Update order status (with workflow validation)
const updateOrderStatus = async (orderId, newStatus, adminNotes) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // Define valid status transitions based on card type
  const validTransitions = {
    digital: {
      "Order Pending": ["Link Created", "Cancelled"],
      "Link Created": ["Cancelled"],
      "Cancelled": []
    },
    "physical-nfc": {
      "Order Pending": ["Printing Pending", "Cancelled"],
      "Printing Pending": ["Printing", "Cancelled"],
      "Printing": ["Dispatched", "Cancelled"],
      "Dispatched": ["Delivered", "Cancelled"],
      "Delivered": [],
      "Cancelled": []
    }
  };

  const cardTypeGroup = order.cardType === "digital" ? "digital" : "physical-nfc";
  const allowedTransitions = validTransitions[cardTypeGroup][order.status] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from '${order.status}' to '${newStatus}' for ${order.cardType} cards. Allowed transitions: ${allowedTransitions.join(", ")}`
    );
  }

  // Handle digital link creation
  if (newStatus === "Link Created" && order.cardType === "digital") {
    order.digitalLink = {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/card/${uuidv4()}`,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      accessCount: 0
    };
  }

  // Handle delivery
  if (newStatus === "Delivered") {
    order.tracking.deliveredAt = new Date();
  }

  // Add to history
  order.history.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: "admin",
    reason: `Status changed from ${order.status} to ${newStatus}`,
    notes: adminNotes
  });

  order.status = newStatus;
  if (adminNotes) {
    order.adminNotes = adminNotes;
  }

  await order.save();
  return order;
};

// Get order statistics
const getOrderStats = async (filters = {}) => {
  const { userId } = filters;
  const query = userId ? { userId } : {};

  const byStatus = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$orderDetails.totalAmount" }
      }
    }
  ]);

  const totalOrders = await Order.countDocuments(query);
  const totalRevenue = byStatus.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0);

  const cardTypeBreakdown = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$cardType",
        count: { $sum: 1 }
      }
    }
  ]);

  // Convert to plain objects to avoid Mongoose array issues
  return {
    totalOrders,
    totalRevenue: Number(totalRevenue) || 0,
    byStatus: JSON.parse(JSON.stringify(byStatus)),
    cardTypeBreakdown: JSON.parse(JSON.stringify(cardTypeBreakdown))
  };
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrderStats
};
