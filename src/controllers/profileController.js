const asyncHandler = require("../middleware/asyncHandler");
const profileService = require("../services/profileService");

const ALLOWED_PROFILE_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const validateProfileImageFiles = (files = {}) => {
  const photo = files.photo?.[0];
  const companyLogo = files.companyLogo?.[0];
  const productImages = files.productImages || [];

  if (photo && !ALLOWED_PROFILE_IMAGE_TYPES.includes(photo.mimetype)) {
    return "Your photo must be JPG, JPEG, or PNG format";
  }

  if (companyLogo && !ALLOWED_PROFILE_IMAGE_TYPES.includes(companyLogo.mimetype)) {
    return "Organization logo must be JPG, JPEG, or PNG format";
  }

  const invalidProductImage = productImages.find(
    (file) => !ALLOWED_PROFILE_IMAGE_TYPES.includes(file.mimetype)
  );

  if (invalidProductImage) {
    return "Product image must be JPG, JPEG, or PNG format";
  }

  return null;
};

const parseMaybeJson = (value) => {
  if (!value || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
};

const buildProfileData = (req) => {
  const raw = req.body.profileData ? parseMaybeJson(req.body.profileData) : req.body;

  const profileData = {
    ...raw,
    contactInfo: parseMaybeJson(raw.contactInfo) || raw.contactInfo,
    studentDetails: parseMaybeJson(raw.studentDetails) || raw.studentDetails,
    enquiryForm: parseMaybeJson(raw.enquiryForm) || raw.enquiryForm,
    products: parseMaybeJson(raw.products) || raw.products
  };

  if (req.files) {
    if (req.files.photo?.[0]) {
      profileData.contactInfo = {
        ...(profileData.contactInfo || {}),
        photo: `/uploads/${req.files.photo[0].filename}`
      };
    }

    if (req.files.companyLogo?.[0]) {
      profileData.companyLogo = `/uploads/${req.files.companyLogo[0].filename}`;
    }

    if (req.files.resumeFile?.[0]) {
      profileData.studentDetails = {
        ...(profileData.studentDetails || {}),
        resumeFile: `/uploads/${req.files.resumeFile[0].filename}`
      };
    }

    const productImages = req.files.productImages || [];
    const productPdfs = req.files.productPdfs || [];
    if (Array.isArray(profileData.products)) {
      profileData.products = profileData.products.map((product, index) => ({
        ...product,
        image: productImages[index]
          ? `/uploads/${productImages[index].filename}`
          : product.image,
        pdf: productPdfs[index]
          ? `/uploads/${productPdfs[index].filename}`
          : product.pdf
      }));
    }
  }

  return profileData;
};

// @desc    Create a new profile
// @route   POST /api/profiles
// @access  Private (User)
const createProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const imageValidationError = validateProfileImageFiles(req.files);
  if (imageValidationError) {
    res.status(400);
    throw new Error(imageValidationError);
  }
  const profileData = buildProfileData(req);

  const profile = await profileService.createProfile(userId, profileData);

  res.status(201).json({
    success: true,
    message: "Profile created successfully",
    data: profile
  });
});

// @desc    Get all profiles for the authenticated user
// @route   GET /api/profiles
// @access  Private (User)
const getUserProfiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profiles = await profileService.getUserProfiles(userId);

  res.status(200).json({
    success: true,
    count: profiles.length,
    data: profiles
  });
});

// @desc    Get a single profile by ID
// @route   GET /api/profiles/:id
// @access  Private (User)
const getProfileById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const profile = await profileService.getProfileById(id, userId);

  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Update a profile
// @route   PUT /api/profiles/:id
// @access  Private (User)
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const imageValidationError = validateProfileImageFiles(req.files);
  if (imageValidationError) {
    res.status(400);
    throw new Error(imageValidationError);
  }
  const updateData = buildProfileData(req);

  // Preserve existing media references when updating without re-uploading files
  const existingProfile = await profileService.getProfileById(id, userId);

  if (updateData.contactInfo) {
    updateData.contactInfo = {
      ...updateData.contactInfo,
      photo: updateData.contactInfo.photo ?? existingProfile.contactInfo?.photo ?? null
    };
  }

  if (updateData.companyLogo === undefined || updateData.companyLogo === null) {
    updateData.companyLogo = existingProfile.companyLogo ?? null;
  }

  if (updateData.studentDetails) {
    updateData.studentDetails = {
      ...updateData.studentDetails,
      resumeFile:
        updateData.studentDetails.resumeFile ??
        existingProfile.studentDetails?.resumeFile ??
        null
    };
  }

  if (Array.isArray(updateData.products)) {
    const existingProducts = Array.isArray(existingProfile.products)
      ? existingProfile.products
      : [];

    updateData.products = updateData.products.map((product, index) => {
      const existingProduct = existingProducts[index] || {};
      return {
        ...product,
        image: product.image ?? existingProduct.image ?? null,
        pdf: product.pdf ?? existingProduct.pdf ?? null
      };
    });
  }

  const profile = await profileService.updateProfile(id, userId, updateData);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: profile
  });
});

// @desc    Delete a profile
// @route   DELETE /api/profiles/:id
// @access  Private (User)
const deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await profileService.deleteProfile(id, userId);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// @desc    Toggle profile active status
// @route   PATCH /api/profiles/:id/toggle
// @access  Private (User)
const toggleProfileStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const profile = await profileService.toggleProfileStatus(id, userId);

  res.status(200).json({
    success: true,
    message: "Profile status updated successfully",
    data: profile
  });
});

// @desc    Get all profiles (Admin)
// @route   GET /api/profiles/admin/all
// @access  Private (Admin)
const getAllProfiles = asyncHandler(async (req, res) => {
  const profiles = await profileService.getAllProfiles();

  res.status(200).json({
    success: true,
    count: profiles.length,
    data: profiles
  });
});

module.exports = {
  createProfile,
  getUserProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  toggleProfileStatus,
  getAllProfiles
};
