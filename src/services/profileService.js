const Profile = require("../models/Profile");

// Create a new profile
const createProfile = async (userId, profileData) => {
  const profile = new Profile({
    userId,
    ...profileData
  });
  return await profile.save();
};

// Get all profiles for a user
const getUserProfiles = async (userId) => {
  return await Profile.find({ userId }).sort({ createdAt: -1 });
};

// Get a single profile by ID
const getProfileById = async (profileId, userId) => {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
};

// Update a profile
const updateProfile = async (profileId, userId, updateData) => {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) {
    throw new Error("Profile not found");
  }

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      profile[key] = updateData[key];
    }
  });

  return await profile.save();
};

// Delete a profile
const deleteProfile = async (profileId, userId) => {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) {
    throw new Error("Profile not found");
  }
  await Profile.deleteOne({ _id: profileId });
  return { message: "Profile deleted successfully" };
};

// Toggle profile active status
const toggleProfileStatus = async (profileId, userId) => {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) {
    throw new Error("Profile not found");
  }
  profile.isActive = !profile.isActive;
  return await profile.save();
};

// Get all profiles (admin only)
const getAllProfiles = async () => {
  return await Profile.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
};

module.exports = {
  createProfile,
  getUserProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  toggleProfileStatus,
  getAllProfiles
};
