const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const CREATE_CARD_API_URL = "https://dev.anurcloud.com/dvc/api/v1/create-card";
const API_KEY = "instaviz_uat_1234";

const safeAppendFile = (form, fieldName, filePath) => {
  if (!filePath) return;

  const absolutePath = filePath.startsWith("/uploads/")
    ? path.join(__dirname, "..", "..", filePath)
    : path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, "..", "..", "uploads", filePath);

  if (fs.existsSync(absolutePath)) {
    form.append(fieldName, fs.createReadStream(absolutePath));
  }
};

const mapProfileToCreateCardPayload = ({
  templateId,
  themeId,
  profile,
  user
}) => {
  const contactInfo = profile.contactInfo || {};
  const studentDetails = profile.studentDetails || {};
  const products = Array.isArray(profile.products) ? profile.products : [];

  const form = new FormData();

  form.append("template_id", templateId);
  form.append("theme_id", themeId);
  form.append("user_name", contactInfo.name || user.name || "");
  form.append("user_designation", contactInfo.designation || "");
  form.append("user_email", contactInfo.email || user.email || "");
  form.append("user_contact_number", contactInfo.phone || "");
  form.append("user_address", contactInfo.address || "");
  form.append("status", String(profile.isActive ?? true));
  form.append("company_name", contactInfo.companyName || "");
  form.append("facebook_url", contactInfo.facebook || "");
  form.append("linkedin_url", contactInfo.linkedin || "");
  form.append("x_url", contactInfo.twitter || "");
  form.append("instagram_url", contactInfo.instagram || "");
  form.append("website", contactInfo.website || "");
  form.append("student_about_me", studentDetails.aboutMe || "");
  form.append("student_skills", JSON.stringify(studentDetails.skills || []));

  if (products.length > 0) {
    form.append("products", JSON.stringify(products.map((product) => ({
      name: product.name,
      description: product.description
    }))));
  } else {
    form.append("products", "");
  }

  safeAppendFile(form, "user_photo", contactInfo.photo);
  safeAppendFile(form, "user_logo", profile.companyLogo);
  safeAppendFile(form, "student_resume", studentDetails.resumeFile);

  products.forEach((product, index) => {
    const imageField = `product_image_${index + 1}`;
    const pdfField = `product_pdf_${index + 1}`;
    safeAppendFile(form, imageField, product.image);
    safeAppendFile(form, pdfField, product.pdf);
  });

  return form;
};

const createExternalCard = async ({ templateId, themeId, profile, user }) => {
  // Validate required fields for API
  const contactInfo = profile.contactInfo || {};
  const validationErrors = [];

  if (!contactInfo.name || !contactInfo.name.trim()) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_name'],
      msg: 'Field required',
      input: null,
    });
  }

  if (!contactInfo.designation || !contactInfo.designation.trim()) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_designation'],
      msg: 'Field required',
      input: null,
    });
  }

  if (!contactInfo.email || !contactInfo.email.trim()) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_email'],
      msg: 'Field required',
      input: null,
    });
  }

  if (!contactInfo.phone || !contactInfo.phone.trim()) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_contact_number'],
      msg: 'Field required',
      input: null,
    });
  }

  if (!contactInfo.address || !contactInfo.address.trim()) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_address'],
      msg: 'Field required',
      input: null,
    });
  }

  if (!contactInfo.photo) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_photo'],
      msg: 'Field required',
      input: null,
    });
  }

  if (!profile.companyLogo) {
    validationErrors.push({
      type: 'missing',
      loc: ['body', 'user_logo'],
      msg: 'Field required',
      input: null,
    });
  }

  // If validation errors exist, throw error
  if (validationErrors.length > 0) {
    const error = new Error('Validation error');
    error.statusCode = 400;
    error.code = 400;
    error.details = validationErrors;
    error.responseData = {
      code: 400,
      message: 'Validation error',
      details: validationErrors,
    };
    throw error;
  }

  const form = mapProfileToCreateCardPayload({ templateId, themeId, profile, user });

  const response = await fetch(CREATE_CARD_API_URL, {
    method: "POST",
    headers: {
      ...form.getHeaders(),
      "X-API-Key": API_KEY
    },
    body: form
  });

  const data = await response.json();

  // Check API response code field (API may return HTTP 200 but code 400/409 in body)
  if (data.code && data.code !== 200) {
    const error = new Error(data.message || "Failed to create card");
    error.statusCode = data.code; // Use API code as status
    error.code = data.code;
    error.details = data.details; // For validation errors
    error.responseData = data;
    throw error;
  }

  if (!response.ok) {
    // Create error object with all details
    const error = new Error(data.message || "Failed to create card");
    error.statusCode = response.status;
    error.code = data.code;
    error.details = data.details; // For validation errors
    error.responseData = data;
    throw error;
  }

  const payload = {
    templateId,
    themeId,
    profileId: profile._id,
    userId: user._id
  };

  return { data, payload };
};

module.exports = {
  createExternalCard
};
