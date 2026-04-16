const multer  = require('multer');
const path    = require('path');

// ─── File type whitelist ───────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|webp/;
const ALLOWED_DOC_TYPES   = /pdf|jpeg|jpg|png/;

const imageFilter = (_req, file, cb) => {
  const ext  = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.split('/')[1];
  if (ALLOWED_IMAGE_TYPES.test(ext) && ALLOWED_IMAGE_TYPES.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, WEBP images are allowed'), false);
  }
};

const docFilter = (_req, file, cb) => {
  const ext  = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.split('/')[1];
  if (ALLOWED_DOC_TYPES.test(ext) || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, JPG, PNG documents are allowed'), false);
  }
};

// ─── Memory storage (buffers sent straight to Cloudinary) ─────────────────────
const memoryStorage = multer.memoryStorage();

// ─── Upload presets ───────────────────────────────────────────────────────────
const uploadAvatar = multer({
  storage:  memoryStorage,
  limits:   { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: imageFilter,
});

const uploadDocument = multer({
  storage:  memoryStorage,
  limits:   { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: docFilter,
});

const uploadPortfolio = multer({
  storage:  memoryStorage,
  limits:   { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: imageFilter,
});

const uploadJobImages = multer({
  storage:  memoryStorage,
  limits:   { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: imageFilter,
});

// ─── Multer error handler wrapper ─────────────────────────────────────────────
const handleUploadError = (upload) => (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadAvatar,
  uploadDocument,
  uploadPortfolio,
  uploadJobImages,
  handleUploadError,
};
