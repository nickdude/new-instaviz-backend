const asyncHandler = require("../middleware/asyncHandler");
const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  createAdmin
} = require("../services/authService");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const result = await registerUser({ name, email, password, phone });

  res.status(201).json({
    success: true,
    data: result
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const result = await loginUser({ email, password });

  res.json({
    success: true,
    data: result
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
const verify = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const result = await verifyEmail({ token });

  res.json({
    success: true,
    data: result
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot
// @access  Public
const forgot = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please provide email");
  }

  const result = await forgotPassword({ email });

  res.json({
    success: true,
    message: result.message
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset/:token
// @access  Public
const reset = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error("Please provide new password");
  }

  const result = await resetPassword({ token, password });

  res.json({
    success: true,
    data: result
  });
});

// @desc    Create admin user (restricted)
// @route   POST /api/auth/create-admin
// @access  Public for first admin, Private/Admin for subsequent
const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const result = await createAdmin({ name, email, password });

  res.status(201).json({
    success: true,
    data: result
  });
});

module.exports = {
  register,
  login,
  verify,
  forgot,
  reset,
  createAdminUser
};
