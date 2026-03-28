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
    // Verify Google ID token (credential) from Google Identity Services
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );
    const googleData = await googleResponse.json();

    if (!googleResponse.ok || !googleData?.sub || !googleData?.email) {
      res.status(401);
      throw new Error("Invalid Google token");
    }

    // Validate token audience (client id) when configured
    const allowedClientIds = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    ].filter(Boolean);

    if (allowedClientIds.length > 0 && !allowedClientIds.includes(googleData.aud)) {
      res.status(401);
      throw new Error("Google token client mismatch");
    }

    if (googleData.email_verified === "false" || googleData.email_verified === false) {
      res.status(401);
      throw new Error("Google email is not verified");
    }

    // Authenticate or create user
    const result = await googleAuth({
      googleId: googleData.sub,
      email: googleData.email,
      name: googleData.name || googleData.email.split("@")[0],
      picture: googleData.picture || null
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
