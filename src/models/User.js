const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"]
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: "",
      sparse: true,
      trim: true
    },
    password: {
      type: String,
      minlength: 6
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifyToken: {
      type: String
    },
    resetToken: {
      type: String
    },
    resetExpires: {
      type: Date
    },
    googleId: {
      type: String
    },
    userType: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
