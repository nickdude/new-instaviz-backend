const { sendEmail } = require("../utils/email");
const User = require("../models/User");
const Order = require("../models/Order");

// Email templates
const getStatusChangeTemplate = (order, newStatus, adminNotes = null) => {
  const statusMessages = {
    "Order Pending": "Your order has been created and is awaiting payment.",
    "Link Created": "Your digital card link has been generated! You can now access it.",
    "Printing Pending": "Your order has been received and is queued for printing.",
    "Printing": "Your order is currently being printed.",
    "Dispatched": "Your order has been shipped! Check tracking info below.",
    "Delivered": "Your order has been delivered. Thank you for your purchase!",
    "Cancelled": "Your order has been cancelled. If you have questions, please contact support."
  };

  const subject = `Order ${order._id.toString().slice(-6).toUpperCase()} - Status Updated to ${newStatus}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0;">Order Status Update</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="color: #666; font-size: 14px;">Hi ${order.userId.name},</p>
        <p style="color: #666; font-size: 14px;">
          ${statusMessages[newStatus] || "Your order status has been updated."}
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Order Details</h3>
        <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${order._id}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> ${newStatus}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Plan:</strong> ${order.planId.title}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Card Type:</strong> ${order.cardType}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${order.orderDetails.quantity}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ₹${order.orderDetails.totalAmount.toFixed(2)}</p>
      </div>

      ${newStatus === "Link Created" && order.digitalLink ? `
        <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Your Digital Link</h3>
          <p style="margin: 5px 0; color: #666;">Click the button below to access your digital card:</p>
          <a href="${order.digitalLink.url}" style="display: inline-block; background-color: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Access Digital Card
          </a>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">This link expires on ${new Date(order.digitalLink.expiresAt).toLocaleDateString()}</p>
        </div>
      ` : ""}

      ${newStatus === "Dispatched" && order.tracking ? `
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Shipping Information</h3>
          ${order.tracking.trackingNumber ? `<p style="margin: 5px 0; color: #666;"><strong>Tracking Number:</strong> ${order.tracking.trackingNumber}</p>` : ""}
          ${order.tracking.carrier ? `<p style="margin: 5px 0; color: #666;"><strong>Carrier:</strong> ${order.tracking.carrier}</p>` : ""}
          ${order.tracking.estimatedDelivery ? `<p style="margin: 5px 0; color: #666;"><strong>Estimated Delivery:</strong> ${new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</p>` : ""}
        </div>
      ` : ""}

      ${adminNotes ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #9c27b0; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Additional Notes</h3>
          <p style="margin: 5px 0; color: #666;">${adminNotes}</p>
        </div>
      ` : ""}

      <div style="border-top: 1px solid #ddd; padding-top: 20px; color: #999; font-size: 12px;">
        <p>If you have any questions, please contact our support team at ${process.env.SUPPORT_EMAIL || "support@instaviz.com"}</p>
        <p>Thank you for using Instaviz!</p>
      </div>
    </div>
  `;

  return { subject, html };
};

// Send order status change notification to user
const notifyUserOrderStatusChange = async (orderId, newStatus, adminNotes = null) => {
  try {
    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("planId", "title");

    if (!order || !order.userId) {
      console.error("Order or user not found for notification");
      return;
    }

    const { subject, html } = getStatusChangeTemplate(order, newStatus, adminNotes);

    await sendEmail({
      to: order.userId.email,
      subject,
      html
    });

    console.log(`Status change notification sent to ${order.userId.email}`);
  } catch (error) {
    console.error("Error sending user notification:", error);
    // Don't throw - notification failure shouldn't block order update
  }
};

// Send order status change notification to admin
const notifyAdminOrderStatusChange = async (orderId, newStatus, changedBy = "system") => {
  try {
    // Find admin users
    const admins = await User.find({ userType: "admin" }, "email name").exec();

    if (admins.length === 0) {
      console.warn("No admin users found for notification");
      return;
    }

    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("planId", "title");

    if (!order) {
      console.error("Order not found for admin notification");
      return;
    }

    const subject = `[ADMIN] Order ${order._id.toString().slice(-6).toUpperCase()} Status Changed to ${newStatus}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Order Status Update - Admin Notification</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 14px;">An order status has been updated:</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Order Details</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${order._id}</p>
          <p style="margin: 5px 0; color: #666;"><strong>User:</strong> ${order.userId.name} (${order.userId.email})</p>
          <p style="margin: 5px 0; color: #666;"><strong>New Status:</strong> ${newStatus}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Plan:</strong> ${order.planId.title}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ₹${order.orderDetails.totalAmount.toFixed(2)}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Changed By:</strong> ${changedBy}</p>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated notification.</p>
        </div>
      </div>
    `;

    // Send to all admins
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject,
        html
      });
    }

    console.log(`Status change notification sent to ${admins.length} admin(s)`);
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
};

// Send order created confirmation
const notifyUserOrderCreated = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("planId", "title");

    if (!order || !order.userId) {
      console.error("Order or user not found");
      return;
    }

    const subject = `Order Confirmation - ${order._id.toString().slice(-6).toUpperCase()}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Order Created Successfully</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 14px;">Hi ${order.userId.name},</p>
          <p style="color: #666; font-size: 14px;">
            Thank you for your order! Your order has been created successfully and is now pending.
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Order Details</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${order._id}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> ${order.status}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Plan:</strong> ${order.planId.title}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Card Type:</strong> ${order.cardType}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${order.orderDetails.quantity}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ₹${order.orderDetails.totalAmount.toFixed(2)}</p>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; color: #999; font-size: 12px;">
          <p>You will receive further updates as your order progresses.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: order.userId.email,
      subject,
      html
    });

    console.log(`Order confirmation sent to ${order.userId.email}`);
  } catch (error) {
    console.error("Error sending order confirmation:", error);
  }
};

module.exports = {
  notifyUserOrderStatusChange,
  notifyAdminOrderStatusChange,
  notifyUserOrderCreated
};
