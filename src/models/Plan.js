const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a plan title"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Please provide a plan description"]
    },
    durationDays: {
      type: Number,
      required: [true, "Please provide plan duration in days"],
      min: [1, "Duration must be at least 1 day"]
    },
    price: {
      rupees: {
        type: Number,
        required: [true, "Please provide price in rupees"]
      },
      dollar: {
        type: Number,
        required: [true, "Please provide price in dollars"]
      }
    },
    cardTypes: {
      type: [String],
      enum: ["physical", "digital", "NFC"],
      required: [true, "Please provide at least one card type"],
      validate: {
        validator: function(array) {
          return array && array.length > 0;
        },
        message: "Card types list cannot be empty"
      }
    },
    features: {
      type: [String],
      required: [true, "Please provide at least one feature"],
      validate: {
        validator: function(array) {
          return array && array.length > 0;
        },
        message: "Features list cannot be empty"
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Plan", planSchema);
