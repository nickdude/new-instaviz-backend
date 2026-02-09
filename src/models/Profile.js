const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    profileType: {
      type: String,
      enum: ["student", "professional"],
      required: true
    },
    layout: {
      type: String,
      enum: ["single", "double", "double-products", "double-enquiry", "triple"],
      required: true
    },
    // Contact Information
    contactInfo: {
      name: {
        type: String,
        required: true
      },
      designation: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      address: String,
      website: String,
      linkedin: String,
      facebook: String,
      instagram: String,
      twitter: String, // X (Twitter)
      github: String,
      photo: String // URL or path to uploaded photo
    },
    // Student-specific fields
    studentDetails: {
      aboutMe: String,
      skills: [String],
      resumeFile: String // URL or path to uploaded resume
    },
    // Professional-specific fields
    companyLogo: String, // URL or path to company logo
    products: [
      {
        name: {
          type: String,
          required: function() {
            return this.products && this.products.length > 0;
          }
        },
        image: String, // URL or path to product image
        description: {
          type: String,
          required: function() {
            return this.products && this.products.length > 0;
          }
        },
        pdf: String // URL or path to product PDF
      }
    ],
    // Enquiry form configuration
    enquiryForm: {
      enabled: {
        type: Boolean,
        default: false
      },
      customMessage: String
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

// Index for faster queries
profileSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("Profile", profileSchema);
