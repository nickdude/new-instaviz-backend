const asyncHandler = require("../middleware/asyncHandler");
const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleAuth,
  createAdmin
} = require("../services/authService");
const fetch = require("node-fetch");

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
  let { token } = req.params;
  // Trim token to remove any trailing characters like '='
  token = token.trim().replace(/=$/, '');

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

// @desc    Google OAuth authentication
// @route   POST /api/auth/google
// @access  Public
const google = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Google token is required");
  }

  try {
    // Verify Google token with Google's API
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );
    const googleData = await googleResponse.json();

    if (!googleResponse.ok) {
      res.status(401);
      throw new Error("Invalid Google token");
    }

    // Get user info from Google
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
    );
    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      res.status(401);
      throw new Error("Failed to fetch user info from Google");
    }

    // Authenticate or create user
    const result = await googleAuth({
      googleId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401);
    throw new Error(error.message || "Google authentication failed");
  }
});

module.exports = {
  register,
  login,
  verify,
  forgot,
  reset,
  google,
  createAdminUser
};
