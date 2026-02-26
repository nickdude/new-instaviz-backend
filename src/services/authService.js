const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const { sendEmail } = require("../utils/email");
const { signToken } = require("../utils/token");

// Register user
const registerUser = async ({ name, email, password, phone = null }) => {
  // Check if user exists by email
  const existingUser = await User.findOne({ email });
  const phoneExist = phone ? await User.findOne({ phone }) : null;
 
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  if (phoneExist) {
    throw new Error("User already exists with this phone number");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token
  const verifyToken = uuidv4();

  // Create user
  const user = await User.create({
    name,
    email,
    phone: phone ? phone.trim() : "",
    password: hashedPassword,
    verifyToken
  });

  // Send verification email
  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${verifyToken}`;
  try {
    await sendEmail({
      to: email,
      subject: "Verify your email",
      text: `Please verify your email by clicking: ${verifyUrl}`,
      html: `<p>Please verify your email by clicking <a href="${verifyUrl}">here</a></p>`
    });
  } catch (error) {
    console.error("Verification email failed:", error);
  }

  // Generate JWT token
  const token = signToken({ id: user._id, userType: user.userType });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      userType: user.userType
    },
    token
  };
};

// Login user
const loginUser = async ({ email, password }) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw new Error("Please verify your email before logging in");
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = signToken({ id: user._id, userType: user.userType });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      userType: user.userType
    },
    token
  };
};

// Verify email
const verifyEmail = async ({ token }) => {
  const user = await User.findOne({ verifyToken: token });
  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save();

  const jwtToken = signToken({ id: user._id, userType: user.userType });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      userType: user.userType
    },
    token: jwtToken
  };
};

// Forgot password
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    return { message: "If email exists, reset link will be sent" };
  }

  // Generate reset token
  const resetToken = uuidv4();
  user.resetToken = resetToken;
  user.resetExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send reset email
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  try {
    await sendEmail({
      to: email,
      subject: "Reset your password",
      text: `Reset your password by clicking: ${resetUrl}`,
      html: `<p>Reset your password by clicking <a href="${resetUrl}">here</a>. This link expires in 1 hour.</p>`
    });
  } catch (error) {
    console.error("Reset email failed:", error);
  }

  return { message: "If email exists, reset link will be sent" };
};

// Reset password
const resetPassword = async ({ token, password }) => {
  const user = await User.findOne({
    resetToken: token,
    resetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();

  const jwtToken = signToken({ id: user._id, userType: user.userType });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      userType: user.userType
    },
    token: jwtToken
  };
};

// Create admin user (restricted, should only be called with proper authorization)
const createAdmin = async ({ name, email, password }) => {
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with admin type and pre-verified
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    userType: "admin",
    isVerified: true
  });

  // Generate JWT token
  const token = signToken({ id: user._id, userType: user.userType });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      userType: user.userType
    },
    token
  };
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  createAdmin
};
