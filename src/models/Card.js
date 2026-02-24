const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true
    },
    templateId: {
      type: String,
      required: true
    },
    themeId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: "created"
    },
    payload: {
      type: Object,
      default: {}
    },
    response: {
      type: Object,
      default: {}
    },
    slug: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

cardSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Card", cardSchema);
