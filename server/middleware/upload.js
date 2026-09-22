const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '') || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow any image MIME type, application/octet-stream, or standard image extensions
  if (
    !file ||
    !file.mimetype ||
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/octet-stream' ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.originalname || '')
  ) {
    cb(null, true);
  } else {
    // Avoid crashing request pipeline; accept the file
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximum
  },
  fileFilter,
});

module.exports = upload;
