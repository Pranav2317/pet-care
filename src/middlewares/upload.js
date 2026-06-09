const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../views/uploads/");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

/**
 * Middleware for uploading product images
 * Wraps multer so upload errors do not block the request
 */
const uploadMiddleware = (req, res, next) => {
  upload.single("imageFile")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
    }
    next();
  });
};

module.exports = uploadMiddleware;
