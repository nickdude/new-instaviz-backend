const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },
    cardType: {
      type: String,
      enum: ["physical", "digital", "NFC"],
      required: true
    },
    // Order details
    orderDetails: {
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      customization: {
        name: String,
        title: String,
        description: String,
        design: String,
        additionalInfo: String
      },
      totalAmount: {
        type: Number,
        required: true
      }
    },
    // Shipping address (for physical cards)
    shippingAddress: {
      fullName: String,
      email: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    // Payment information
    paymentDetails: {
      orderId: String,
      paymentId: String,
      signature: String,
      amount: Number,
      currency: String,
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
      }
    },
    // Status workflow based on card type
    status: {
      type: String,
      enum: [
        "Order Pending",      // All: Customer filled details but payment not complete
        "Link Created",        // Digital only: Payment successful, link generated
        "Printing Pending",   // Physical/NFC: Payment successful, awaiting production
        "Printing",           // Physical/NFC: Currently being printed
        "Dispatched",         // Physical/NFC: Sent from warehouse
        "Delivered",          // Physical/NFC: Customer received
        "Cancelled"           // All: Order cancelled by user or admin
      ],
      default: "Order Pending"
    },
    // Link for digital cards
    digitalLink: {
      url: String,
      expiresAt: Date,
      accessCount: {
        type: Number,
        default: 0
      }
    },
    // Tracking information for physical cards
    tracking: {
      trackingNumber: String,
      carrier: String,
      estimatedDelivery: Date,
      deliveredAt: Date
    },
    // Notes and comments
    notes: String,
    adminNotes: String,
    
    // Order status history (for timeline view)
    history: [
      {
        status: String,
        changedAt: {
          type: Date,
          default: Date.now
        },
        changedBy: {
          type: String, // 'user' or 'admin'
          enum: ['user', 'admin'],
          default: 'user'
        },
        reason: String, // Reason for status change
        notes: String   // Any additional notes about this change
      }
    ],
    
    // Subscription check at order time
    wasSubscriptionActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ planId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
