const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file extension first (this catches .jfif that might report as image/jpeg)
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExtensions = ['.jfif', '.webp', '.gif', '.bmp'];
  
  if (blockedExtensions.includes(ext)) {
    return cb(new Error(`${ext.toUpperCase()} format is not allowed. Only JPG, JPEG, PNG, and PDF are accepted.`), false);
  }

  const blockedMimes = ["image/jfif", "image/webp", "image/gif", "image/bmp"];
  
  // Block specific MIME types
  if (blockedMimes.includes(file.mimetype)) {
    return cb(new Error("This format is not allowed. Only JPG, JPEG, PNG, and PDF are accepted."), false);
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf"
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
